import { useState, useRef, useCallback } from "react";
import "./App.css";
import { Terminal } from "./Terminal";
import type { Session } from "./Terminal";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

// ─── Version ───────────────────────────────────────────────────────────────

const APP_VERSION = "0.1.0";

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

interface RustVaultIdentity {
  vmd_id: string;
  vault_name: string;
  ai_name: string;
  spore_version: string;
}

// ─── Vault persistence ─────────────────────────────────────────────────────

function loadVaults(): Vault[] {
  try {
    const stored = localStorage.getItem("vmd-vaults");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveVaults(vaults: Vault[]) {
  localStorage.setItem("vmd-vaults", JSON.stringify(vaults));
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const HEALTH_LABELS = {
  healthy: "All healthy",
  warning: "Warnings",
  error: "Errors detected",
};

function getAggregateHealth(vaults: Vault[]): "healthy" | "warning" | "error" {
  if (vaults.some((v) => v.health === "error")) return "error";
  if (vaults.some((v) => v.health === "warning")) return "warning";
  return "healthy";
}

function pickColour(vaults: Vault[]): string {
  const used = new Set(vaults.map((v) => v.colour));
  return (
    VAULT_COLOURS.find((c) => !used.has(c.hex))?.hex ??
    VAULT_COLOURS[vaults.length % VAULT_COLOURS.length].hex
  );
}

// ─── HealthDot ─────────────────────────────────────────────────────────────

function HealthDot({ status }: { status: "healthy" | "warning" | "error" }) {
  return <span className={`health-dot health-${status}`} />;
}

// ─── TopBar ────────────────────────────────────────────────────────────────

function TopBar({
  vaults,
  onAddVault,
}: {
  vaults: Vault[];
  onAddVault: () => void;
}) {
  const health = getAggregateHealth(vaults);
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="app-name">VMD Desktop</span>
        <span className="app-version">v{APP_VERSION}</span>
        <button className="btn-primary" onClick={onAddVault}>+ Add VMD</button>
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
  onRemove,
  activeSessions,
}: {
  vault: Vault;
  onOpen: (vault: Vault) => void;
  onLaunchTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
  activeSessions: Session[];
}) {
  const hasConnect = activeSessions.some(
    (s) => s.vaultId === vault.id && s.mode === "connect"
  );
  const hasShell = activeSessions.some(
    (s) => s.vaultId === vault.id && s.mode === "shell"
  );
  const isActive = hasConnect || hasShell;
  const c = vault.colour;

  const cardStyle = {
    background: `linear-gradient(135deg,
      color-mix(in srgb, ${c} 38%, #1e3733) 0%,
      color-mix(in srgb, ${c} 18%, #172b28) 45%,
      #172b28 100%)`,
    border: `1px solid color-mix(in srgb, ${c} ${isActive ? "55%" : "30%"}, transparent)`,
    boxShadow: isActive
      ? `0 0 0 1px color-mix(in srgb, ${c} 20%, transparent), 0 4px 24px color-mix(in srgb, ${c} 18%, transparent)`
      : `0 2px 12px color-mix(in srgb, ${c} 10%, transparent)`,
  };

  return (
    <div className="vault-card" style={cardStyle}>
      <div className="vault-card-header">
        <div className="vault-card-identity">
          <span className="vault-colour-dot" style={{ background: c }} />
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
          style={hasConnect ? { borderColor: c, color: c } : {}}
          onClick={() => onOpen(vault)}
        >
          {hasConnect ? "● Open" : "Open"}
        </button>
        <button
          className={`btn-action ${hasShell ? "btn-action--active" : ""}`}
          style={hasShell ? { borderColor: c, color: c } : {}}
          onClick={() => onLaunchTerminal(vault)}
        >
          {hasShell ? "● Terminal" : "Terminal"}
        </button>
        <button
          className="btn-action btn-action--ghost btn-action--danger"
          onClick={() => onRemove(vault)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── VaultRegistry ─────────────────────────────────────────────────────────

function VaultRegistry({
  vaults,
  onOpen,
  onLaunchTerminal,
  onRemove,
  activeSessions,
}: {
  vaults: Vault[];
  onOpen: (vault: Vault) => void;
  onLaunchTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
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
          onRemove={onRemove}
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
  busySessions,
  onActivate,
  onClose,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  busySessions: Set<string>;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="tab-bar">
      {sessions.map((s) => {
        const isActive = s.id === activeSessionId;
        const isBusy = busySessions.has(s.id);

        const tabStyle = isActive
          ? {
              background: `color-mix(in srgb, ${s.colour} 14%, #0e1a19)`,
              borderBottom: `2px solid ${s.colour}`,
              color: "var(--text)",
            }
          : {};

        return (
          <button
            key={s.id}
            className={`tab ${isActive ? "tab--active" : ""} ${isBusy ? "tab--busy" : ""}`}
            style={tabStyle}
            onClick={() => onActivate(s.id)}
          >
            <span
              className={`tab-dot ${isBusy ? "tab-dot--busy" : ""}`}
              style={{
                background: s.colour,
                boxShadow: isActive ? `0 0 6px ${s.colour}` : undefined,
              }}
            />
            <span className="tab-vault-name">{s.vaultName}</span>
            <span
              className="tab-mode-badge"
              style={isActive ? { color: s.colour, background: `color-mix(in srgb, ${s.colour} 15%, transparent)` } : {}}
            >
              {s.mode === "connect" ? "EVE" : "SH"}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(s.id);
              }}
              title="Close"
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
  busySessions,
  onActivate,
  onClose,
  onActivity,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  busySessions: Set<string>;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onActivity: (sessionId: string) => void;
}) {
  return (
    <div className="terminal-panel-outer">
      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        busySessions={busySessions}
        onActivate={onActivate}
        onClose={onClose}
      />
      <div className="terminal-stack">
        {sessions.length === 0 ? (
          <div className="terminal-empty-state">
            <div className="terminal-empty-icon">⬡</div>
            <div className="terminal-empty-title">No active sessions</div>
            <div className="terminal-empty-hint">
              Click <strong>Open</strong> to connect to a vault's AI,
              or <strong>Terminal</strong> for a plain shell.
            </div>
          </div>
        ) : (
          sessions.map((s) => (
            <Terminal
              key={s.id}
              session={s}
              isActive={s.id === activeSessionId}
              onActivity={onActivity}
            />
          ))
        )}
      </div>
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
  const [vaults, setVaults] = useState<Vault[]>(loadVaults);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [busySessions, setBusySessions] = useState<Set<string>>(new Set());
  const busyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleActivity = useCallback((sessionId: string) => {
    setBusySessions((prev) => new Set(prev).add(sessionId));
    if (busyTimers.current[sessionId]) clearTimeout(busyTimers.current[sessionId]);
    busyTimers.current[sessionId] = setTimeout(() => {
      setBusySessions((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }, 1500);
  }, []);

  const handleAddVault = useCallback(async () => {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: "Select VMD Vault Folder",
    });
    if (!selected || typeof selected !== "string") return;

    try {
      const identity = await invoke<RustVaultIdentity>("read_vault_identity", { path: selected });

      // Skip duplicates
      if (vaults.some((v) => v.id === identity.vmd_id || v.path === selected)) return;

      const newVault: Vault = {
        id: identity.vmd_id || `MYC-${Date.now()}`,
        name: identity.vault_name || selected.split("/").pop() || "Unknown Vault",
        path: selected,
        health: "healthy",
        nodeCount: 0,
        lastSession: "New",
        aiName: identity.ai_name || "Unknown",
        sporeVersion: identity.spore_version || "?",
        colour: pickColour(vaults),
      };

      const updated = [...vaults, newVault];
      setVaults(updated);
      saveVaults(updated);
    } catch (err) {
      console.error("Failed to add vault:", err);
    }
  }, [vaults]);

  const handleRemoveVault = useCallback((vault: Vault) => {
    // Close any open sessions for this vault
    setSessions((prev) => {
      const toClose = prev.filter((s) => s.vaultId === vault.id);
      toClose.forEach((s) => invoke("pty_close", { sessionId: s.id }).catch(() => {}));
      const next = prev.filter((s) => s.vaultId !== vault.id);
      setActiveSessionId((cur) => {
        if (toClose.some((s) => s.id === cur)) return next[0]?.id ?? null;
        return cur;
      });
      return next;
    });

    setVaults((prev) => {
      const updated = prev.filter((v) => v.id !== vault.id);
      saveVaults(updated);
      return updated;
    });
  }, []);

  const openSession = useCallback((vault: Vault, mode: "shell" | "connect") => {
    const id = makeSessionId();
    const session: Session = {
      id,
      vaultId: vault.id,
      vaultName: vault.name,
      mode,
      colour: vault.colour,
      vaultPath: vault.path,
    };
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(id);
  }, []);

  const closeSession = useCallback((id: string) => {
    invoke("pty_close", { sessionId: id }).catch(() => {});
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        const neighbour = next[idx - 1] ?? next[idx] ?? null;
        setActiveSessionId(neighbour?.id ?? null);
      }
      return next;
    });
  }, [activeSessionId]);

  if (vaults.length === 0) {
    return <FirstRun onAdd={handleAddVault} />;
  }

  return (
    <div className="app-shell">
      <TopBar vaults={vaults} onAddVault={handleAddVault} />
      <VaultRegistry
        vaults={vaults}
        onOpen={(v) => openSession(v, "connect")}
        onLaunchTerminal={(v) => openSession(v, "shell")}
        onRemove={handleRemoveVault}
        activeSessions={sessions}
      />
      <TerminalPanel
        sessions={sessions}
        activeSessionId={activeSessionId}
        busySessions={busySessions}
        onActivate={setActiveSessionId}
        onClose={closeSession}
        onActivity={handleActivity}
      />
    </div>
  );
}
