import { useState } from "react";
import "./App.css";
import { Terminal } from "./Terminal";
import type { Session } from "./Terminal";
import { invoke } from "@tauri-apps/api/core";

// ─── Vault colour palette ──────────────────────────────────────────────────

const VAULT_COLOURS = [
  { id: "teal",    hex: "#14b8a6" },
  { id: "indigo",  hex: "#6366f1" },
  { id: "rose",    hex: "#f43f5e" },
  { id: "amber",   hex: "#f59e0b" },
  { id: "violet",  hex: "#a855f7" },
  { id: "sky",     hex: "#0ea5e9" },
  { id: "emerald", hex: "#10b981" },
  { id: "coral",   hex: "#fb7185" },
];

function makeSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Interfaces ────────────────────────────────────────────────────────────

interface Vault {
  id: string;
  name: string;
  path: string;
  health: "healthy" | "warning" | "error";
  nodeCount: number;
  lastSession: string;
  aiName: string;
  sporeVersion: string;
  colour: string;
}

const MOCK_VAULTS: Vault[] = [
  {
    id: "MYC-74832",
    name: "VMD-Orchestrator",
    path: "/Users/douglassimoes/Documents/NeuromanceCo/Obsidian Vaults/VMD-Orchestrator",
    health: "healthy",
    nodeCount: 38,
    lastSession: "2026-03-27",
    aiName: "Eve",
    sporeVersion: "0.4.0",
    colour: VAULT_COLOURS[0].hex, // teal
  },
  {
    id: "MYC-74831",
    name: "Mycelium-Vault",
    path: "/Users/douglassimoes/Documents/NeuromanceCo/Obsidian Vaults/Mycelium-Vault",
    health: "healthy",
    nodeCount: 52,
    lastSession: "2026-03-24",
    aiName: "Eve",
    sporeVersion: "0.4.0",
    colour: VAULT_COLOURS[1].hex, // indigo
  },
];

const HEALTH_LABELS = {
  healthy: "All healthy",
  warning: "Warnings",
  error: "Errors detected",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getAggregateHealth(vaults: Vault[]): "healthy" | "warning" | "error" {
  if (vaults.some((v) => v.health === "error")) return "error";
  if (vaults.some((v) => v.health === "warning")) return "warning";
  return "healthy";
}

// ─── HealthDot ─────────────────────────────────────────────────────────────

function HealthDot({ status }: { status: "healthy" | "warning" | "error" }) {
  return <span className={`health-dot health-${status}`} />;
}

// ─── TopBar ────────────────────────────────────────────────────────────────

function TopBar({ vaults }: { vaults: Vault[] }) {
  const health = getAggregateHealth(vaults);
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="app-name">VMD Desktop</span>
        <button className="btn-primary">+ Add VMD</button>
        <input className="search-input" type="text" placeholder="Search vaults..." />
      </div>
      <div className="top-bar-right">
        <span className="vault-count">
          {vaults.length} vault{vaults.length !== 1 ? "s" : ""}
        </span>
        <span className={`health-badge health-${health}`}>
          <HealthDot status={health} />
          {HEALTH_LABELS[health]}
        </span>
        <button className="btn-icon" title="Settings">⚙</button>
      </div>
    </header>
  );
}

// ─── VaultCard ─────────────────────────────────────────────────────────────

function VaultCard({
  vault,
  onOpen,
  onLaunchTerminal,
  activeSessions,
}: {
  vault: Vault;
  onOpen: (vault: Vault) => void;
  onLaunchTerminal: (vault: Vault) => void;
  activeSessions: Session[];
}) {
  const hasConnect = activeSessions.some(
    (s) => s.vaultId === vault.id && s.mode === "connect"
  );
  const hasShell = activeSessions.some(
    (s) => s.vaultId === vault.id && s.mode === "shell"
  );
  const isActive = hasConnect || hasShell;

  const cardStyle = {
    borderLeft: `3px solid ${vault.colour}`,
    ...(isActive
      ? {
          boxShadow: `0 0 0 1px ${vault.colour}33, 0 0 12px ${vault.colour}18`,
          background: `color-mix(in srgb, ${vault.colour} 6%, var(--bg-surface))`,
        }
      : {}),
  };

  return (
    <div
      className={`vault-card ${isActive ? "vault-card--active" : ""}`}
      style={cardStyle}
    >
      <div className="vault-card-header">
        <div className="vault-card-identity">
          <HealthDot status={vault.health} />
          <span className="vault-id">{vault.id}</span>
          <span className="vault-name">{vault.name}</span>
        </div>
        <span className="vault-ai-badge">
          {vault.aiName} · Spore {vault.sporeVersion}
        </span>
      </div>
      <div className="vault-card-meta">
        <span>{vault.nodeCount} nodes</span>
        <span className="meta-sep">·</span>
        <span>Last session: {vault.lastSession}</span>
        <span className="meta-sep">·</span>
        <span className="vault-path">{vault.path}</span>
      </div>
      <div className="vault-card-actions">
        <button
          className={`btn-action ${hasConnect ? "btn-action--active" : ""}`}
          onClick={() => onOpen(vault)}
        >
          {hasConnect ? "● Open" : "Open"}
        </button>
        <button
          className={`btn-action ${hasShell ? "btn-action--active" : ""}`}
          onClick={() => onLaunchTerminal(vault)}
        >
          {hasShell ? "● Terminal" : "Terminal"}
        </button>
        <button className="btn-action btn-action--ghost">Archive</button>
      </div>
    </div>
  );
}

// ─── VaultRegistry ─────────────────────────────────────────────────────────

function VaultRegistry({
  vaults,
  onOpen,
  onLaunchTerminal,
  activeSessions,
}: {
  vaults: Vault[];
  onOpen: (vault: Vault) => void;
  onLaunchTerminal: (vault: Vault) => void;
  activeSessions: Session[];
}) {
  return (
    <main className="vault-registry">
      {vaults.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          onOpen={onOpen}
          onLaunchTerminal={onLaunchTerminal}
          activeSessions={activeSessions}
        />
      ))}
    </main>
  );
}

// ─── TabBar ────────────────────────────────────────────────────────────────

function TabBar({
  sessions,
  activeSessionId,
  onActivate,
  onClose,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="tab-bar">
      {sessions.map((s) => {
        const isActive = s.id === activeSessionId;
        const tabStyle = isActive
          ? {
              background: `color-mix(in srgb, ${s.colour} 12%, transparent)`,
              borderBottom: `2px solid ${s.colour}`,
              color: "var(--text)",
            }
          : {};

        return (
          <button
            key={s.id}
            className={`tab ${isActive ? "tab--active" : ""}`}
            style={tabStyle}
            onClick={() => onActivate(s.id)}
          >
            <span
              className="tab-dot"
              style={{ background: s.colour }}
            />
            <span className="tab-vault-name">{s.vaultName}</span>
            <span className="tab-mode-badge">
              {s.mode === "connect" ? "EVE" : "SH"}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(s.id);
              }}
              title="Close tab"
            >
              ×
            </button>
          </button>
        );
      })}
    </div>
  );
}

// ─── TerminalPanel ─────────────────────────────────────────────────────────

function TerminalPanel({
  sessions,
  activeSessionId,
  onActivate,
  onClose,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const isEmpty = sessions.length === 0;

  return (
    <div className="terminal-panel-outer">
      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onActivate={onActivate}
        onClose={onClose}
      />
      {isEmpty ? (
        <div className="terminal-empty-state">
          <div className="terminal-empty-icon">⬡</div>
          <p className="terminal-empty-title">No active sessions</p>
          <p className="terminal-empty-hint">
            Click <strong>Open</strong> or <strong>Terminal</strong> on a vault to begin
          </p>
        </div>
      ) : (
        <Terminal session={activeSession} />
      )}
    </div>
  );
}

// ─── FirstRun ──────────────────────────────────────────────────────────────

function FirstRun({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="first-run">
      <div className="first-run-content">
        <div className="first-run-icon">⬡</div>
        <h1>VMD Desktop</h1>
        <p className="first-run-subtitle">No vaults registered yet.</p>
        <button className="btn-primary btn-primary--large" onClick={onAdd}>
          + Add New Vault
        </button>
        <div className="first-run-alt">
          <a href="#">Open existing Spore folder</a>
          <span className="meta-sep">·</span>
          <a href="#">Initialize new vault</a>
        </div>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [vaults] = useState<Vault[]>(MOCK_VAULTS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (vaults.length === 0) {
    return <FirstRun onAdd={() => {}} />;
  }

  function openSession(vault: Vault, mode: "shell" | "connect") {
    const id = makeSessionId();
    const newSession: Session = {
      id,
      vaultId: vault.id,
      vaultName: vault.name,
      mode,
      colour: vault.colour,
      vaultPath: vault.path,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
  }

  function closeSession(id: string) {
    invoke("pty_close", { sessionId: id }).catch(() => {});
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        if (next.length === 0) {
          setActiveSessionId(null);
        } else {
          // prefer left neighbour, otherwise right
          const newIdx = Math.max(0, idx - 1);
          setActiveSessionId(next[newIdx]?.id ?? null);
        }
      }
      return next;
    });
  }

  return (
    <div className="app-shell">
      <TopBar vaults={vaults} />
      <VaultRegistry
        vaults={vaults}
        onOpen={(v) => openSession(v, "connect")}
        onLaunchTerminal={(v) => openSession(v, "shell")}
        activeSessions={sessions}
      />
      <TerminalPanel
        sessions={sessions}
        activeSessionId={activeSessionId}
        onActivate={setActiveSessionId}
        onClose={closeSession}
      />
    </div>
  );
}
