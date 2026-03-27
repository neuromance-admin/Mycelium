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
}

export function Terminal({ activeVault }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const activeVaultIdRef = useRef<string | null>(null);

  // Mount xterm once
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#0a0a0c",
        foreground: "#e4e4e7",
        cursor: "#a3e635",
        cursorAccent: "#0a0a0c",
        selectionBackground: "#3f3f46",
        black: "#18181b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#f59e0b",
        blue: "#6366f1",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e4e4e7",
        brightBlack: "#52525b",
        brightGreen: "#4ade80",
        brightWhite: "#fafafa",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 2000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

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

    // Refit on container resize
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(containerRef.current);

    return () => {
      unlistenPromise.then((fn) => fn());
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // Spawn a new PTY when active vault changes
  useEffect(() => {
    if (!activeVault || activeVault.id === activeVaultIdRef.current) return;
    activeVaultIdRef.current = activeVault.id;

    xtermRef.current?.clear();

    const dims = fitAddonRef.current?.proposeDimensions();
    invoke("pty_create", {
      vaultPath: activeVault.path,
      cols: dims?.cols ?? 80,
      rows: dims?.rows ?? 24,
    }).catch((err) => {
      xtermRef.current?.writeln(`\r\nFailed to start terminal: ${err}\r\n`);
    });
  }, [activeVault]);

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span className="terminal-title">
          {activeVault ? `Terminal — ${activeVault.name}` : "Terminal"}
        </span>
        {activeVault && (
          <span className="terminal-vault-id">{activeVault.id}</span>
        )}
      </div>
      <div ref={containerRef} className="terminal-body" />
    </div>
  );
}
