# Mycelium

The desktop companion for Mycelium vaults — register, manage, launch, and upgrade AI-memory vaults from a single native macOS app.

Built with Tauri, React, and Rust.

> **Release candidate — 1.0.0-rc.1.** This is the first public build. See [RELEASE_NOTES.md](RELEASE_NOTES.md) for what's in it and how to report issues.

---

## What is Mycelium?

**Mycelium is a persistent memory framework for AI assistants.** It's a way to give a model like Claude long-term context that survives across sessions, projects, and machines. A **Mycelium vault** is a folder of structured markdown that describes a person, their work, their relationships, and their intent. Claude reads the vault at the start of every session and arrives knowing who you are and what you're working on — no re-onboarding, no lost context.

**This app is the desktop companion** for managing those vaults. It doesn't run the AI — it runs the *operations* around the AI: vault registration, health checks, terminal launching, install and upgrade flows, persona file management. One native window, all your vaults, one click to any of them.

Mycelium is built and maintained by [neuromance](https://www.neuromance.co.za).

---

## Download

**→ [Download the latest release](https://github.com/neuromance-admin/Mycelium/releases/latest)**

### Requirements

- macOS 12 Monterey or later
- Apple Silicon (M1 / M2 / M3 / M4) — no Intel build in this release candidate
- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code/overview) installed and on your `PATH` (required for the Claude / Install / Upgrade actions)
- [Obsidian](https://obsidian.md) (optional, used by the in-app Obsidian shortcut)

### Installing an unsigned build

Mycelium is not yet code-signed by Apple. When you first open the DMG, macOS will warn you that the app "can't be opened" or "is damaged." **This is expected** — it's Gatekeeper being strict about any app from a developer who hasn't paid the Apple Developer fee. A signed build will follow once the product graduates from release candidate.

**To unlock on first launch:**

1. Open the DMG and drag **Mycelium.app** into your **Applications** folder
2. Go to `/Applications` in Finder
3. **Right-click** (or Control-click) Mycelium.app → **Open** → click **Open** in the dialog
4. From here on, double-click launches normally

If step 3 doesn't show an **Open** button, go to **System Settings → Privacy & Security**, scroll to the bottom, find "Mycelium was blocked…" and click **Open Anyway**.

---

## What it does

- **Vault registry** — see every registered Mycelium vault with health status, runtime version, and owner info
- **One-click actions** — open any vault in Claude, Terminal, Finder, or Obsidian
- **Claude sessions** — the Claude button launches your chosen terminal with the vault's runtime loaded, so a full Mycelium session spins up in one click
- **Install new vaults** — pick a folder, Mycelium drops in the bundled installer and launches Claude to run it
- **Upgrade vaults** — bumps a vault's runtime to the latest Spore version with one click
- **Dynamic terminal detection** — Terminal.app, iTerm2, Warp, Ghostty, Kitty, and Alacritty are detected automatically; pick your preferred one in Settings
- **Light and dark themes** with a working in-app toggle
- **Persona shortcuts** — Owner and AI persona files one click away from the top bar (for setups using external persona directories)

---

## Building from source

Contributors and the curious can build Mycelium locally.

### Prerequisites

```bash
# Xcode Command Line Tools
xcode-select --install

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Node.js and pnpm
brew install node
npm install -g pnpm
```

### Clone and run in dev mode

```bash
git clone https://github.com/neuromance-admin/Mycelium.git
cd Mycelium
pnpm install
pnpm tauri dev
```

Dev mode gives you hot reload on the React frontend and auto-recompile on Rust backend changes.

### Build a release DMG

```bash
pnpm tauri build
```

Built artifacts land in `src-tauri/target/release/bundle/`:

- `macos/Mycelium.app` — the bundled application
- `dmg/Mycelium_<version>_aarch64.dmg` — the installer

---

## Project structure

```
Mycelium/
├── src/                        # React frontend
│   ├── App.tsx                 # Main app, vault registry, settings, handlers
│   ├── App.css                 # Design system + component styles
│   └── assets/                 # SVG icons and logos
├── src-tauri/
│   ├── src/
│   │   └── lib.rs              # Rust backend: vault parsing, terminal detection, install/upgrade
│   ├── resources/              # Bundled Spore runtime files (installer + upgrade)
│   ├── icons/                  # macOS, iOS, Android icon sets
│   └── tauri.conf.json         # Tauri bundler config
├── README.md
└── RELEASE_NOTES.md
```

The `resources/` directory ships the current Mycelium runtime files inside the app bundle — so a fresh install of Mycelium always has the installer and upgrade procedures it needs, without an external download.

---

## Feedback

This is a release candidate precisely because the best bugs are found by other people. If you try Mycelium and something breaks, surprises you, or just feels off, drop me a line at **halicon@gmail.com**, or open an issue on GitHub. I'd rather hear it early than ship 1.0 with it still in there.

---

## License

Apache License 2.0. See [LICENSE](LICENSE).

---

## Credits

- **Framework** — [Tauri](https://tauri.app/) · [React](https://react.dev/)
- **Icons** — [Lucide](https://lucide.dev/)
- **AI** — [Anthropic / Claude](https://www.anthropic.com/)
- **Designed and built** by halicon at [neuromance](https://www.neuromance.co.za)

---

*Part of the Mycelium Network Framework. Built to compound over time.*
