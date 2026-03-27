import { useState } from "react";
import "./App.css";

interface Vault {
  id: string;
  name: string;
  path: string;
  health: "healthy" | "warning" | "error";
  nodeCount: number;
  lastSession: string;
  aiName: string;
  sporeVersion: string;
}

const MOCK_VAULTS: Vault[] = [
  {
    id: "MYC-74832",
    name: "VMD-Orchestrator",
    path: "~/Documents/NeuromanceCo/Obsidian Vaults/VMD-Orchestrator",
    health: "healthy",
    nodeCount: 38,
    lastSession: "2026-03-27",
    aiName: "Eve",
    sporeVersion: "0.4.0",
  },
  {
    id: "MYC-74831",
    name: "Mycelium-Vault",
    path: "~/Documents/NeuromanceCo/Obsidian Vaults/Mycelium-Vault",
    health: "healthy",
    nodeCount: 52,
    lastSession: "2026-03-24",
    aiName: "Eve",
    sporeVersion: "0.4.0",
  },
];

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

function HealthDot({ status }: { status: "healthy" | "warning" | "error" }) {
  return <span className={`health-dot health-${status}`} />;
}

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

function VaultCard({
  vault,
  onLaunchTerminal,
  activeVaultId,
}: {
  vault: Vault;
  onLaunchTerminal: (vault: Vault) => void;
  activeVaultId: string | null;
}) {
  const isActive = activeVaultId === vault.id;
  return (
    <div className={`vault-card ${isActive ? "vault-card--active" : ""}`}>
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
        <button className="btn-action">Open</button>
        <button
          className={`btn-action ${isActive ? "btn-action--active" : ""}`}
          onClick={() => onLaunchTerminal(vault)}
        >
          {isActive ? "● Terminal" : "Terminal"}
        </button>
        <button className="btn-action btn-action--ghost">Archive</button>
      </div>
    </div>
  );
}

function VaultRegistry({
  vaults,
  onLaunchTerminal,
  activeVaultId,
}: {
  vaults: Vault[];
  onLaunchTerminal: (vault: Vault) => void;
  activeVaultId: string | null;
}) {
  return (
    <main className="vault-registry">
      {vaults.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          onLaunchTerminal={onLaunchTerminal}
          activeVaultId={activeVaultId}
        />
      ))}
    </main>
  );
}

function Terminal({ activeVault }: { activeVault: Vault | null }) {
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
      <div className="terminal-body">
        {activeVault ? (
          <>
            <div className="terminal-line terminal-line--cmd">
              $ claude --project .
            </div>
            <div className="terminal-line terminal-line--output">
              {activeVault.aiName} loaded. Running Spore-v{activeVault.sporeVersion}. Ready.
            </div>
            <div className="terminal-line terminal-line--cursor">
              $ <span className="cursor">▋</span>
            </div>
          </>
        ) : (
          <div className="terminal-line terminal-line--hint">
            Select a vault and click Terminal to begin a session.
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function App() {
  const [vaults] = useState<Vault[]>(MOCK_VAULTS);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);

  const activeVault = vaults.find((v) => v.id === activeVaultId) ?? null;

  if (vaults.length === 0) {
    return <FirstRun onAdd={() => {}} />;
  }

  return (
    <div className="app-shell">
      <TopBar vaults={vaults} />
      <VaultRegistry
        vaults={vaults}
        onLaunchTerminal={(v) => setActiveVaultId(v.id)}
        activeVaultId={activeVaultId}
      />
      <Terminal activeVault={activeVault} />
    </div>
  );
}
