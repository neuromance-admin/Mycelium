# VMD Desktop

A native Mac desktop app for managing Mycelium VMD vaults. Register vaults, monitor health, open plain terminal sessions, and connect directly to your vault's AI — all from one place.

Built with Tauri + React + TypeScript + Rust.

---

## Prerequisites

### 1. Xcode Command Line Tools
```bash
xcode-select --install
```

### 2. Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 4. Node.js + pnpm
```bash
brew install node
npm install -g pnpm
```

### 5. Claude CLI
The app requires the Claude CLI to be installed and authenticated on your machine. Install it from [claude.ai/code](https://claude.ai/code), then run:
```bash
claude
```
Follow the authentication flow. The app will not work without this.

---

## Setup

```bash
git clone https://github.com/neuromance-admin/VMDTerm.git
cd VMDTerm
pnpm install
```

---

## Development

Run the app in dev mode (hot reload on frontend changes, auto-recompile on Rust changes):
```bash
pnpm tauri dev
```

---

## Install to /Applications

Run the installer script to build a production release and install it to `/Applications`:
```bash
./install.sh
```

Run this any time you want to update the installed version.

---

## Project Structure

```
VMDTerm/
├── src/                    # React frontend
│   ├── App.tsx             # Main app, vault registry, tab bar, session state
│   ├── App.css             # Design system + component styles
│   └── Terminal.tsx        # xterm.js terminal component (one instance per session)
├── src-tauri/
│   └── src/
│       └── lib.rs          # Rust backend: PTY management, IPC commands
└── install.sh              # Build + install script
```

---

## Architecture Notes

- **Terminal sessions**: Each session has its own PTY process and xterm.js instance. Sessions are identified by a unique ID and persist until closed.
- **Vault colours**: Each vault is auto-assigned a colour from an 8-colour palette. The colour links vault cards to their terminal tabs visually.
- **Claude integration**: Clicking **Open** on a vault spawns a shell in the vault root and auto-invokes `claude` with a prompt that runs the vault's Spore bootstrap, ending with the handshake.
- **PTY**: Uses `portable-pty` (not `tauri-plugin-shell`) for a real pseudo-terminal — required for interactive CLI tools like Claude.
- **Font**: Menlo — always present on Mac, renders TUI layouts correctly.
