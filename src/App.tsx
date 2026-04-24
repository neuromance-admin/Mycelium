import { useState, useCallback, useEffect, useMemo } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Terminal, Bot, Folder, NotebookPen, X, SlidersHorizontal, User } from "lucide-react";
import firstRunHero from "./assets/first-run-hero.jpg";

// ─── Version ───────────────────────────────────────────────────────────────

const APP_VERSION = "1.0.1-beta";

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
  persona_mode: string;
  persona_dir: string;
}

interface AppSettings {
  defaultTerminal: string;
  theme: string;
  vaultScanOnLaunch: boolean;
}

interface TerminalApp {
  id: string;
  name: string;
  path: string;
}

interface SporeRelease {
  version: string;
  installer_filename: string | null;
  upgrade_filename: string | null;
  folder_path: string;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  defaultTerminal: "terminal",
  theme: "dark",
  vaultScanOnLaunch: true,
};

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

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem("vmd-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate legacy capitalised terminal ids ("Terminal", "iTerm") to lowercase
      const legacyTerminal: Record<string, string> = { Terminal: "terminal", iTerm: "iterm" };
      if (parsed.defaultTerminal && legacyTerminal[parsed.defaultTerminal]) {
        parsed.defaultTerminal = legacyTerminal[parsed.defaultTerminal];
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem("vmd-settings", JSON.stringify(settings));
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

// ─── WarningsModal ─────────────────────────────────────────────────────────

function WarningsModal({
  vaults,
  onClose,
}: {
  vaults: Vault[];
  onClose: () => void;
}) {
  const issues = vaults.filter((v) => v.health !== "healthy");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Vault Warnings</span>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {issues.length === 0 ? (
            <p className="modal-empty">All vaults are healthy.</p>
          ) : (
            issues.map((v) => (
              <div key={v.id} className={`warning-item warning-item--${v.health}`}>
                <span className="vault-colour-dot" style={{ background: v.colour }} />
                <div className="warning-item-detail">
                  <span className="warning-item-name">{v.name}</span>
                  <span className="warning-item-message">{v.healthMessage}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SettingsModal ─────────────────────────────────────────────────────────

function SettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AppSettings>({ ...settings });
  const [terminals, setTerminals] = useState<TerminalApp[]>([]);

  const update = (key: keyof AppSettings, value: string | boolean) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    invoke<TerminalApp[]>("list_terminals")
      .then((found) => {
        setTerminals(found);
        // If the saved terminal isn't in the detected list, fall back to the first one found
        if (found.length > 0 && !found.some((t) => t.id === local.defaultTerminal)) {
          setLocal((prev) => ({ ...prev, defaultTerminal: found[0].id }));
        }
      })
      .catch((err) => console.error("Failed to list terminals:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Settings</span>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label className="settings-field">
            <span className="settings-label">Default Terminal</span>
            <select
              className="settings-input"
              value={local.defaultTerminal}
              onChange={(e) => update("defaultTerminal", e.target.value)}
            >
              {terminals.length === 0 && (
                <option value={local.defaultTerminal}>Detecting…</option>
              )}
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            <span className="settings-label">Theme</span>
            <select
              className="settings-input"
              value={local.theme}
              onChange={(e) => update("theme", e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="settings-field settings-field--row">
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={local.vaultScanOnLaunch}
              onChange={(e) => update("vaultScanOnLaunch", e.target.checked)}
            />
            <span className="settings-label">Scan vaults on launch</span>
          </label>
          <label className="settings-field">
            <span className="settings-label">Spore Releases Folder</span>
            <button
              className="btn-action"
              onClick={() => invoke("open_spore_folder").catch(console.error)}
            >
              Open in Finder
            </button>
          </label>
          <div className="settings-divider" />
          <div className="settings-credits">
            <span className="settings-credits-title">Credits</span>
            <span className="settings-credit">Mycelium made by <a href="https://www.neuromance.co.za/" target="_blank" rel="noreferrer">neuromance</a></span>
            <span className="settings-credit">Icons by <a href="https://lucide.dev/" target="_blank" rel="noreferrer">Lucide</a></span>
            <span className="settings-credit">App framework by <a href="https://tauri.app/" target="_blank" rel="noreferrer">Tauri</a></span>
            <span className="settings-credit">UI by <a href="https://react.dev/" target="_blank" rel="noreferrer">React</a></span>
            <span className="settings-credit">AI by <a href="https://anthropic.com/" target="_blank" rel="noreferrer">Anthropic / Claude</a></span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-action" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onSave(local); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── TopBar ────────────────────────────────────────────────────────────────

function TopBar({
  vaults,
  onOpenOwnerPersona,
  onOpenAiPersona,
  onShowWarnings,
  onShowSettings,
}: {
  vaults: Vault[];
  onOpenOwnerPersona: () => void;
  onOpenAiPersona: () => void;
  onShowWarnings: () => void;
  onShowSettings: () => void;
}) {
  const health = getAggregateHealth(vaults);
  const healthLabels = { healthy: "All healthy", warning: "Warnings", error: "Errors" };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="app-name">Mycelium</span>
      </div>
      <div className="top-bar-right">
        <button className="btn-persona" onClick={onOpenOwnerPersona} title="Open Owner persona in Obsidian">
          <User size={16} /> Owner MD File
        </button>
        <button className="btn-persona" onClick={onOpenAiPersona} title="Open AI persona in Obsidian">
          <Bot size={16} /> AI MD File
        </button>
        <button
          className={`health-badge health-${health}`}
          onClick={onShowWarnings}
          title="View vault warnings"
        >
          <HealthDot status={health} />
          {healthLabels[health]}
        </button>
        <button className="btn-icon" title="Settings" onClick={onShowSettings}><SlidersHorizontal size={24} /></button>
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
  onUpgrade,
}: {
  vault: Vault;
  onOpen: (vault: Vault) => void;
  onTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
  onOpenFinder: (vault: Vault) => void;
  onOpenObsidian: (vault: Vault) => void;
  onUpgrade: (vault: Vault) => void;
}) {
  const needsUpgrade = vault.health === "warning" && vault.healthMessage.includes("upgrade");

  return (
    <div className="vault-card">
      <div className="vault-card-colour-bar" style={{ background: vault.colour }} />
      <button className="vault-card-close" onClick={() => onRemove(vault)} title="Remove vault"><X size={14} /></button>
      <div className="vault-card-body">
        <div className="vault-card-header">
          <div className="vault-card-identity">
            <HealthDot status={vault.health} />
            <span className="vault-name">{vault.name}</span>
          </div>
          <span className="vault-ai-badge">{vault.aiName} · Spore {vault.sporeVersion}</span>
        </div>
        {vault.healthMessage && (
          <div className={`vault-health-row ${needsUpgrade ? "vault-health-row--upgrade" : ""}`}>
            <div className={`vault-health-message vault-health-message--${vault.health}`}>
              {vault.healthMessage}
            </div>
            {needsUpgrade && (
              <button className="btn-upgrade" onClick={() => onUpgrade(vault)}>Upgrade</button>
            )}
          </div>
        )}
        <div className="vault-card-meta">
          <span className="vault-id">{vault.id}</span>
          <span className="vault-path">{vault.path}</span>
        </div>
        <div className="vault-card-actions">
          <button className="btn-icon-sm btn-icon-sm--labeled" onClick={() => onOpen(vault)} title="Connect to vault AI (opens Terminal)"><Bot size={14} /> Claude</button>
          <button className="btn-icon-sm btn-icon-sm--labeled" onClick={() => onTerminal(vault)} title="Open terminal at vault root"><Terminal size={14} /> Terminal</button>
          <button className="btn-icon-sm btn-icon-sm--labeled" onClick={() => onOpenFinder(vault)} title="Open in Finder"><Folder size={14} /> Finder</button>
          <button className="btn-icon-sm btn-icon-sm--labeled" onClick={() => onOpenObsidian(vault)} title="Open in Obsidian"><NotebookPen size={14} /> Obsidian</button>
        </div>
      </div>
    </div>
  );
}

// ─── VaultRegistry ─────────────────────────────────────────────────────────

function VaultRegistry({
  vaults,
  sporeRelease,
  onOpen,
  onTerminal,
  onRemove,
  onOpenFinder,
  onOpenObsidian,
  onAddVault,
  onInstallVault,
  onUpgrade,
}: {
  vaults: Vault[];
  sporeRelease: SporeRelease | null;
  onOpen: (vault: Vault) => void;
  onTerminal: (vault: Vault) => void;
  onRemove: (vault: Vault) => void;
  onOpenFinder: (vault: Vault) => void;
  onOpenObsidian: (vault: Vault) => void;
  onAddVault: () => void;
  onInstallVault: () => void;
  onUpgrade: (vault: Vault) => void;
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
        <button className="btn-primary" onClick={onAddVault}>+ Add Vault</button>
        <button className="btn-primary" onClick={onInstallVault}>+ Install New Vault</button>
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
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
      <div className="app-version-footer">Mycelium v{APP_VERSION}{sporeRelease ? ` · Spore v${sporeRelease.version}` : ""}</div>
    </main>
  );
}

// ─── FirstRun ──────────────────────────────────────────────────────────────

function FirstRun({ onAdd, onInstall, splash = false }: { onAdd: () => void; onInstall: () => void; splash?: boolean }) {
  return (
    <div className="first-run">
      <div className="first-run-content">
        <img src={firstRunHero} alt="Mycelium" className="first-run-hero-img" />
        <h1>Mycelium</h1>
        {!splash && (
          <>
            <p className="first-run-subtitle">No vaults registered yet.</p>
            <div className="first-run-buttons">
              <button className="btn-primary btn-primary--large" onClick={onAdd}>+ Add New Vault</button>
              <button className="btn-primary btn-primary--large" onClick={onInstall}>+ Install New Vault</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [vaults, setVaults] = useState<Vault[]>(loadVaults);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [personaPaths, setPersonaPaths] = useState<{ owner: string; ai: string } | null>(null);
  const [sporeRelease, setSporeRelease] = useState<SporeRelease | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // Resolve persona paths from the first vault that has them
  useEffect(() => {
    if (vaults.length === 0) return;
    const vault = vaults[0];
    invoke<RustVaultIdentity>("read_vault_identity", { path: vault.path })
      .then((identity) => {
        if (identity.persona_mode === "external" && identity.persona_dir) {
          const base = vault.path + "/" + identity.persona_dir;
          setPersonaPaths({
            owner: base + "Owner/halicon.md",
            ai: base + "AI/Eve.md",
          });
        }
      })
      .catch(() => {});
  }, [vaults]);

  // Fetch latest spore release info
  useEffect(() => {
    invoke<SporeRelease>("get_spore_release")
      .then(setSporeRelease)
      .catch((err) => console.error("Failed to get spore release:", err));
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
    invoke("open_in_terminal", { path: vault.path, launchClaude: true, terminalApp: settings.defaultTerminal }).catch(console.error);
  }, [settings.defaultTerminal]);

  const handleTerminal = useCallback((vault: Vault) => {
    invoke("open_in_terminal", { path: vault.path, launchClaude: false, terminalApp: settings.defaultTerminal }).catch(console.error);
  }, [settings.defaultTerminal]);

  const handleOpenFinder = useCallback((vault: Vault) => {
    invoke("open_in_finder", { path: vault.path }).catch(console.error);
  }, []);

  const handleOpenObsidian = useCallback((vault: Vault) => {
    invoke("open_in_obsidian", { path: vault.path }).catch(console.error);
  }, []);

  const handleOpenOwnerPersona = useCallback(() => {
    if (personaPaths) {
      invoke("open_persona_in_obsidian", { filePath: personaPaths.owner }).catch(console.error);
    }
  }, [personaPaths]);

  const handleOpenAiPersona = useCallback(() => {
    if (personaPaths) {
      invoke("open_persona_in_obsidian", { filePath: personaPaths.ai }).catch(console.error);
    }
  }, [personaPaths]);

  const handleInstallVault = useCallback(async () => {
    const selected = await openDialog({ directory: true, multiple: false, title: "Select folder for new vault" });
    if (!selected || typeof selected !== "string") return;
    invoke("install_vault", { path: selected, terminalApp: settings.defaultTerminal }).catch(console.error);
  }, [settings.defaultTerminal]);

  const handleUpgrade = useCallback((vault: Vault) => {
    invoke("upgrade_vault", { path: vault.path, terminalApp: settings.defaultTerminal }).catch(console.error);
  }, [settings.defaultTerminal]);

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
    document.documentElement.className = s.theme === "light" ? "theme-light" : "";
  }, []);

  // Apply saved theme on mount
  useEffect(() => {
    document.documentElement.className = settings.theme === "light" ? "theme-light" : "";
  }, []);

  if (showSplash || vaults.length === 0) return <FirstRun splash={showSplash} onAdd={handleAddVault} onInstall={handleInstallVault} />;

  return (
    <div className={`app-shell ${settings.theme === "light" ? "theme-light" : ""}`}>
      <TopBar
        vaults={vaults}
        onOpenOwnerPersona={handleOpenOwnerPersona}
        onOpenAiPersona={handleOpenAiPersona}
        onShowWarnings={() => setShowWarnings(true)}
        onShowSettings={() => setShowSettings(true)}
      />
      <VaultRegistry
        vaults={vaults}
        sporeRelease={sporeRelease}
        onOpen={handleOpen}
        onTerminal={handleTerminal}
        onRemove={handleRemoveVault}
        onOpenFinder={handleOpenFinder}
        onOpenObsidian={handleOpenObsidian}
        onAddVault={handleAddVault}
        onInstallVault={handleInstallVault}
        onUpgrade={handleUpgrade}
      />
      {showWarnings && (
        <WarningsModal vaults={vaults} onClose={() => setShowWarnings(false)} />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
