import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";

export interface Session {
  id: string;
  vaultId: string;
  vaultName: string;
  mode: "shell" | "connect";
  colour: string;
  vaultPath: string;
}

interface Props {
  session: Session;
  isActive: boolean;
  onActivity: (sessionId: string) => void;
}

export function Terminal({ session, isActive, onActivity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const spawnedRef = useRef(false);

  // Mount xterm once per session instance
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#111f1e",
        foreground: "#e8f5f3",
        cursor: session.colour,           // matches vault colour
        cursorAccent: "#111f1e",
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

    // Double-rAF ensures the container has been painted before fitting
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
        const d = fitAddon.proposeDimensions();
        if (d) {
          invoke("pty_resize", { sessionId: session.id, cols: d.cols, rows: d.rows }).catch(() => {});
        }
        term.refresh(0, term.rows - 1);
      });
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // PTY data listener
    const unlistenPromise = listen<string>(`pty-data-${session.id}`, (event) => {
      term.write(event.payload);
      onActivity(session.id);
    });

    // Keyboard input — normalise bare CR → CR+LF so shells execute on first Enter
    const onDataDisposable = term.onData((data) => {
      const toWrite = data === "\r" ? "\r\n" : data;
      invoke("pty_write", { sessionId: session.id, data: toWrite }).catch(console.error);
    });

    // Resize observer
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitAddon.fit();
          const d = fitAddon.proposeDimensions();
          if (d) {
            invoke("pty_resize", { sessionId: session.id, cols: d.cols, rows: d.rows }).catch(() => {});
          }
        });
      });
    });
    observer.observe(containerRef.current);

    // Spawn PTY once
    if (!spawnedRef.current) {
      spawnedRef.current = true;
      invoke("pty_create", {
        sessionId: session.id,
        vaultPath: session.vaultPath,
        cols: 80,
        rows: 24,
        launchClaude: session.mode === "connect",
      }).catch((err) => {
        term.writeln(`\r\nFailed to start terminal: ${err}\r\n`);
      });
    }

    return () => {
      unlistenPromise.then((fn) => fn());
      onDataDisposable.dispose();
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // Refit when tab becomes active — double-rAF to let display:flex paint first
  useEffect(() => {
    if (!isActive) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        const d = fitAddonRef.current?.proposeDimensions();
        if (d) {
          invoke("pty_resize", { sessionId: session.id, cols: d.cols, rows: d.rows }).catch(() => {});
        }
        if (xtermRef.current) {
          xtermRef.current.refresh(0, xtermRef.current.rows - 1);
        }
      });
    });
  }, [isActive]);

  const headerStyle = {
    background: `linear-gradient(90deg, color-mix(in srgb, ${session.colour} 12%, #1e3733) 0%, #1a3330 100%)`,
    borderLeft: `3px solid ${session.colour}`,
  };

  return (
    <div className={`terminal-wrapper ${isActive ? "terminal-wrapper--active" : ""}`}>
      <div className="terminal-panel">
        <div className="terminal-header" style={headerStyle}>
          <span
            className="terminal-header-dot"
            style={{ background: session.colour }}
          />
          <span className="terminal-title">
            {session.mode === "connect"
              ? `${session.vaultName} — Connected`
              : `Terminal — ${session.vaultName}`}
          </span>
          <span className="terminal-vault-id">{session.vaultId}</span>
        </div>
        <div ref={containerRef} className="terminal-body" />
      </div>
    </div>
  );
}
