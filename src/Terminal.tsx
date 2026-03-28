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
  session: Session | null;
}

export function Terminal({ session }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  // Track which session IDs have already been spawned
  const spawnedRef = useRef<Set<string>>(new Set());

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
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // When session changes, attach listener and spawn PTY if new
  useEffect(() => {
    if (!session) return;

    const term = xtermRef.current;
    if (!term) return;

    term.clear();

    // Attach listener for this session's PTY data
    const eventName = `pty-data-${session.id}`;
    const unlistenPromise = listen<string>(eventName, (event) => {
      term.write(event.payload);
    });

    // Wire up keyboard input to this session
    const onDataDisposable = term.onData((data) => {
      invoke("pty_write", { sessionId: session.id, data }).catch(console.error);
    });

    // Spawn PTY only once per session ID
    if (!spawnedRef.current.has(session.id)) {
      spawnedRef.current.add(session.id);

      const dims = fitAddonRef.current?.proposeDimensions();
      invoke("pty_create", {
        sessionId: session.id,
        vaultPath: session.vaultPath,
        cols: dims?.cols ?? 80,
        rows: dims?.rows ?? 24,
        launchClaude: session.mode === "connect",
      }).catch((err) => {
        term.writeln(`\r\nFailed to start terminal: ${err}\r\n`);
      });

      // Initial resize after spawn
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        const d = fitAddonRef.current?.proposeDimensions();
        if (d) {
          invoke("pty_resize", {
            sessionId: session.id,
            cols: d.cols,
            rows: d.rows,
          }).catch(() => {});
        }
      });
    }

    // Resize observer scoped to this session
    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          fitAddonRef.current?.fit();
          const d = fitAddonRef.current?.proposeDimensions();
          if (d) {
            invoke("pty_resize", {
              sessionId: session.id,
              cols: d.cols,
              rows: d.rows,
            }).catch(() => {});
          }
        });
      });
      resizeObserver.observe(container);
    }

    return () => {
      unlistenPromise.then((fn) => fn());
      onDataDisposable.dispose();
      resizeObserver?.disconnect();
    };
  }, [session?.id]);

  const headerStyle = session
    ? {
        background: `linear-gradient(90deg, color-mix(in srgb, ${session.colour} 8%, #1e3733) 0%, #1a3330 100%)`,
        borderLeft: `3px solid ${session.colour}`,
      }
    : {};

  return (
    <div className="terminal-panel">
      <div className="terminal-header" style={headerStyle}>
        <span className="terminal-title">
          {session
            ? session.mode === "connect"
              ? `${session.vaultName} — Connected`
              : `Terminal — ${session.vaultName}`
            : "Terminal"}
        </span>
        {session && (
          <span className="terminal-vault-id">{session.vaultId}</span>
        )}
      </div>
      <div ref={containerRef} className="terminal-body" />
    </div>
  );
}
