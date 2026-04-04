import { useState, useCallback, useEffect, useMemo } from "react";
import "./App.css";
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

// ─── Interfaces ────────────────────────────────────────────────────────────

interface Vault {
  id: string;
  name: string;
  path: string;
  health: "healthy" | "warning" | "error";
  healthMessage: string;
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
  health: string;
  health_message: string;
}

interface CliStatus {
  installed: boolean;
  version: string;
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

function coerceHealth(s: string): "healthy" | "warning" | "error" {
  if (s === "warning") return "warning";
  if (s === "error") return "error";
  return "healthy";
}

// ─── HealthDot ─────────────────────────────────────────────────────────────

function HealthDot({ status }: { status: "healthy" | "warning" | "error" }) {
  return <span className={`health-dot health-${status}`} />;
}

// ─── TopBar ────────────────────────────────────────────────────────────────

function TopBar({
  vaults,
  cliStatus,
  onAddVault,
}: {
  vaults: Vault[];
  cliStatus: CliStatus | null;
  onAddVault: () => void;
}) {
  const health = getAggregateHealth(vaults);
  const healthLabels = { healthy: "All healthy", warning: "Warnings", error: "Errors" };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="app-name">VMD Desktop</span>
        <span className="app-version">v{APP_VERSION}</span>
        <button className="btn-primary" onClick={onAddVault}>+ Add VMD</button>
      </div>
      <div className="top-bar-right">
        {cliStatus !== null && (
          <span
            className={`cli-status-badge cli-status--${cliStatus.installed ? "ok" : "error"}`}
            title={cliStatus.installed ? `Claude CLI ${cliStatus.version}` : "Claude CLI not found"}
          >
            <span className={`health-dot health-${cliStatus.installed ? "healthy" : "error"}`} />
            Claude CLI
          </span>
        )}
        <span className="vault-count">{vaults.length} vault{vaults.length !== 1 ? "s" : ""}</span>
        <span className={`health-badge health-${health}`}>
          <HealthDot status={health} />
          {healthLabels[health]}
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
  onTerminal,
  onRemove,
  onOpenFinder,
  onOpenObsidian,
}: {
  vault: Vault;
  onOpen: (vault: Vault) => void;
  onTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
  onOpenFinder: (vault: Vault) => void;
  onOpenObsidian: (vault: Vault) => void;
}) {
  const c = vault.colour;

  const cardStyle = {
    background: `linear-gradient(135deg,
      color-mix(in srgb, ${c} 38%, #1e3733) 0%,
      color-mix(in srgb, ${c} 18%, #172b28) 45%,
      #172b28 100%)`,
    border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
    boxShadow: `0 2px 12px color-mix(in srgb, ${c} 10%, transparent)`,
  };

  return (
    <div className="vault-card" style={cardStyle}>
      <div className="vault-card-header">
        <div className="vault-card-identity">
          <span className="vault-colour-dot" style={{ background: c }} />
          <HealthDot status={vault.health} />
          <span className="vault-name">{vault.name}</span>
        </div>
        <span className="vault-ai-badge">{vault.aiName} · Spore {vault.sporeVersion}</span>
      </div>
      {vault.healthMessage && (
        <div className={`vault-health-message vault-health-message--${vault.health}`}>
          {vault.healthMessage}
        </div>
      )}
      <div className="vault-card-meta">
        <span className="vault-id">{vault.id}</span>
        <span className="vault-path">{vault.path}</span>
      </div>
      <div className="vault-card-actions">
        <button className="btn-icon-sm" onClick={() => onOpen(vault)} title="Connect to vault AI (opens Terminal)">◎</button>
        <button className="btn-icon-sm" onClick={() => onTerminal(vault)} title="Open terminal at vault root">⌨</button>
        <button className="btn-icon-sm" onClick={() => onOpenFinder(vault)} title="Open in Finder">⌂</button>
        <button className="btn-icon-sm" onClick={() => onOpenObsidian(vault)} title="Open in Obsidian">◈</button>
        <button className="btn-icon-sm btn-icon-sm--danger" onClick={() => onRemove(vault)} title="Remove vault">✕</button>
      </div>
    </div>
  );
}

// ─── VaultRegistry ─────────────────────────────────────────────────────────

function VaultRegistry({
  vaults,
  onOpen,
  onTerminal,
  onRemove,
  onOpenFinder,
  onOpenObsidian,
}: {
  vaults: Vault[];
  onOpen: (vault: Vault) => void;
  onTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
  onOpenFinder: (vault: Vault) => void;
  onOpenObsidian: (vault: Vault) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vaults;
    return vaults.filter((v) => v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
  }, [vaults, query]);

  return (
    <main className="vault-registry">
      <div className="vault-search">
        <input
          className="vault-search-input"
          type="text"
          placeholder="Search vaults..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="vault-grid">
        {filtered.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            onOpen={onOpen}
            onTerminal={onTerminal}
            onRemove={onRemove}
            onOpenFinder={onOpenFinder}
            onOpenObsidian={onOpenObsidian}
          />
        ))}
      </div>
    </main>
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
        <button className="btn-primary btn-primary--large" onClick={onAdd}>+ Add New Vault</button>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [vaults, setVaults] = useState<Vault[]>(loadVaults);
  const [cliStatus, setCliStatus] = useState<CliStatus | null>(null);

  useEffect(() => {
    invoke<CliStatus>("check_claude_cli")
      .then(setCliStatus)
      .catch(() => setCliStatus({ installed: false, version: "" }));
  }, []);

  // Refresh vault health from disk on every launch
  useEffect(() => {
    if (vaults.length === 0) return;
    Promise.allSettled(
      vaults.map((v) =>
        invoke<RustVaultIdentity>("read_vault_identity", { path: v.path })
          .then((identity) => ({
            id: v.id,
            health: coerceHealth(identity.health),
            healthMessage: identity.health_message,
            sporeVersion: identity.spore_version || v.sporeVersion,
            aiName: identity.ai_name || v.aiName,
          }))
          .catch(() => null)
      )
    ).then((results) => {
      setVaults((prev) => {
        const updates = new Map(
          results
            .map((r) => (r.status === "fulfilled" ? r.value : null))
            .filter(Boolean)
            .map((u) => [u!.id, u!])
        );
        if (updates.size === 0) return prev;
        const next = prev.map((v) => { const u = updates.get(v.id); return u ? { ...v, ...u } : v; });
        saveVaults(next);
        return next;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddVault = useCallback(async () => {
    const selected = await openDialog({ directory: true, multiple: false, title: "Select VMD Vault Folder" });
    if (!selected || typeof selected !== "string") return;
    try {
      const identity = await invoke<RustVaultIdentity>("read_vault_identity", { path: selected });
      if (vaults.some((v) => v.id === identity.vmd_id || v.path === selected)) return;
      const newVault: Vault = {
        id: identity.vmd_id || `MYC-${Date.now()}`,
        name: identity.vault_name || selected.split("/").pop() || "Unknown Vault",
        path: selected,
        health: coerceHealth(identity.health),
        healthMessage: identity.health_message || "",
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
    setVaults((prev) => { const updated = prev.filter((v) => v.id !== vault.id); saveVaults(updated); return updated; });
  }, []);

  const handleOpen = useCallback((vault: Vault) => {
    invoke("open_in_terminal", { path: vault.path, launchClaude: true }).catch(console.error);
  }, []);

  const handleTerminal = useCallback((vault: Vault) => {
    invoke("open_in_terminal", { path: vault.path, launchClaude: false }).catch(console.error);
  }, []);

  const handleOpenFinder = useCallback((vault: Vault) => {
    invoke("open_in_finder", { path: vault.path }).catch(console.error);
  }, []);

  const handleOpenObsidian = useCallback((vault: Vault) => {
    invoke("open_in_obsidian", { path: vault.path }).catch(console.error);
  }, []);

  if (vaults.length === 0) return <FirstRun onAdd={handleAddVault} />;

  return (
    <div className="app-shell">
      <TopBar vaults={vaults} cliStatus={cliStatus} onAddVault={handleAddVault} />
      <VaultRegistry
        vaults={vaults}
        onOpen={handleOpen}
        onTerminal={handleTerminal}
        onRemove={handleRemoveVault}
        onOpenFinder={handleOpenFinder}
        onOpenObsidian={handleOpenObsidian}
      />
    </div>
  );
}
