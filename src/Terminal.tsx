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
        cursor: session.colour,
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

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Register PTY data listener before spawning
    const unlistenPromise = listen<string>(`pty-data-${session.id}`, (event) => {
      term.write(event.payload);
      term.scrollToBottom();
      onActivity(session.id);
    });

    // Send keystrokes as-is — PTY line discipline handles CR→LF conversion
    const onDataDisposable = term.onData((data) => {
      invoke("pty_write", { sessionId: session.id, data }).catch(console.error);
    });

    // Open xterm and spawn PTY inside double-rAF so the container is
    // guaranteed to be painted with real dimensions before xterm initialises.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        term.open(containerRef.current);
        fitAddon.fit();

        const d = fitAddon.proposeDimensions();
        const cols = d?.cols ?? 80;
        const rows = d?.rows ?? 24;

        term.refresh(0, term.rows - 1);
        term.focus();

        // Spawn PTY once xterm is properly initialised
        if (!spawnedRef.current) {
          spawnedRef.current = true;
          unlistenPromise.then(() => {
            invoke("pty_create", {
              sessionId: session.id,
              vaultPath: session.vaultPath,
              cols,
              rows,
              launchClaude: session.mode === "connect",
            })
              .then(() => {
                // SIGWINCH after shell starts — forces zsh to redraw prompt
                setTimeout(() => {
                  const dims = fitAddonRef.current?.proposeDimensions();
                  if (dims) {
                    invoke("pty_resize", {
                      sessionId: session.id,
                      cols: dims.cols,
                      rows: dims.rows,
                    }).catch(() => {});
                  }
                }, 400);
              })
              .catch((err) => {
                term.writeln(`\r\nFailed to start terminal: ${err}\r\n`);
              });
          });
        }
      });
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
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      unlistenPromise.then((fn) => fn());
      onDataDisposable.dispose();
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // Refit and focus when tab becomes active
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
          xtermRef.current.focus();
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
