import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";

interface Vault {
  id: string;
  name: string;
  path: string;
}

interface Props {
  activeVault: Vault | null;
  launchMode: "shell" | "connect";
}

export function Terminal({ activeVault, launchMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const activeSessionRef = useRef<{ vaultId: string; mode: string } | null>(null);

  // Mount xterm once
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#111f1e",
        foreground: "#e8f5f3",
        cursor: "#14b8a6",
        cursorAccent: "#0c1917",
        selectionBackground: "#2a4f4a",
        black: "#172b28",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#f59e0b",
        blue: "#2dd4bf",
        magenta: "#a855f7",
        cyan: "#14b8a6",
        white: "#dff0ee",
        brightBlack: "#355550",
        brightGreen: "#4ade80",
        brightWhite: "#f0fafa",
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 15,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 2000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    requestAnimationFrame(() => {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims) {
        invoke("pty_resize", { cols: dims.cols, rows: dims.rows }).catch(() => {});
      }
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Stream PTY output into terminal
    const unlistenPromise = listen<string>("pty-data", (event) => {
      term.write(event.payload);
    });

    // Send keystrokes to PTY
    term.onData((data) => {
      invoke("pty_write", { data }).catch(console.error);
    });

    // Refit on container resize and sync PTY dimensions
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          invoke("pty_resize", { cols: dims.cols, rows: dims.rows }).catch(() => {});
        }
      });
    });
    observer.observe(containerRef.current);

    return () => {
      unlistenPromise.then((fn) => fn());
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // Spawn a new PTY when active vault or mode changes
  useEffect(() => {
    if (!activeVault) return;
    const sessionKey = `${activeVault.id}:${launchMode}`;
    if (sessionKey === `${activeSessionRef.current?.vaultId}:${activeSessionRef.current?.mode}`) return;
    activeSessionRef.current = { vaultId: activeVault.id, mode: launchMode };

    xtermRef.current?.clear();

    const dims = fitAddonRef.current?.proposeDimensions();
    invoke("pty_create", {
      vaultPath: activeVault.path,
      cols: dims?.cols ?? 80,
      rows: dims?.rows ?? 24,
      launchClaude: launchMode === "connect",
    }).catch((err) => {
      xtermRef.current?.writeln(`\r\nFailed to start terminal: ${err}\r\n`);
    });
  }, [activeVault, launchMode]);

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span className="terminal-title">
          {activeVault
            ? launchMode === "connect"
              ? `${activeVault.name} — Connected`
              : `Terminal — ${activeVault.name}`
            : "Terminal"}
        </span>
        {activeVault && (
          <span className="terminal-vault-id">{activeVault.id}</span>
        )}
      </div>
      <div ref={containerRef} className="terminal-body" />
    </div>
  );
}
