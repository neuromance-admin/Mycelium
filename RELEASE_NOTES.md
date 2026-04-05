# Mycelium — Release Notes

## 1.0.0-rc.1 — First public release candidate

The first public build of Mycelium, the desktop companion for Mycelium vaults.

This is a **release candidate**, not a final 1.0. It's unsigned — see "Installing an unsigned build" below. Feedback is very welcome.

### What Mycelium does

Mycelium is a native macOS app that sits on top of your Mycelium vault folders. From one window you can:

- See all your vaults at a glance, with health status and Spore version
- Open a vault in Terminal, Finder, or Obsidian in one click
- Launch a Claude session that reads the vault's Spore runtime and hands you a fresh handshake
- Install a new Mycelium vault into any folder (copies the bundled installer and runs it)
- Upgrade a vault's Spore runtime to the latest version
- Manage owner and AI persona files without leaving the app

### What's in this build

- Fresh native macOS app icon (designed in Icon Composer)
- In-app top-bar icon rendered from SVG — crisp at any size
- Dynamic terminal detection — Terminal.app, iTerm2, Warp, Ghostty, Kitty, Alacritty (any that are installed will show up in Settings → Default Terminal)
- Per-terminal command execution: full AppleScript support for Terminal.app and iTerm2; `open -a` fallback for the rest; Claude-launch cases always route through a scriptable terminal so the session lands reliably
- Vault cards with colour bars, health dots, and one-click actions (Claude, Terminal, Finder, Obsidian)
- Install New Vault flow — pick a folder, app drops in the bundled Mycelium installer, launches Claude to run it
- Upgrade Vault flow — copies the Spore upgrade file and launches Claude to run it
- Light and dark themes with a working toggle in Settings
- Persona file shortcuts (Owner + AI) in the top bar

### Requirements

- macOS 12 Monterey or later
- Apple Silicon (M1 / M2 / M3 / M4) — this build is `aarch64`, no Intel binary yet
- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code/overview) installed and on your `PATH` (required for the Claude / Install / Upgrade buttons)
- [Obsidian](https://obsidian.md) (optional, required for the Obsidian button)

### Installing an unsigned build

Mycelium is not yet code-signed by Apple. When you first open the DMG, macOS will tell you the app "can't be opened because Apple cannot check it for malicious software" or that it "is damaged." **This is expected** — it's Gatekeeper being strict about any app that hasn't paid the Apple Developer tax ($99/year). The app is not damaged.

**To unlock it (once, first launch only):**

1. Download the DMG, open it, drag **Mycelium.app** into your **Applications** folder
2. In Finder, go to `/Applications`
3. **Right-click** (or Control-click) Mycelium.app → **Open**
4. You'll see a warning dialog with an **Open** button — click it
5. Mycelium launches. From now on, it opens normally with a double-click.

If step 4 doesn't show an Open button (newer macOS versions sometimes hide it):
- System Settings → Privacy & Security → scroll to the bottom → find "Mycelium was blocked..." → click **Open Anyway**

### Known limitations

- **Apple Silicon only.** No Intel build in this release candidate.
- **Unsigned.** See above.
- **Install New Vault flow is not fully tested end-to-end** — the Upgrade flow has been verified, Install is expected to work but please report any issues.
- **Terminal command execution** only works fully in Terminal.app and iTerm2. Other detected terminals (Warp, Ghostty, Kitty, Alacritty) will open at the vault path but the Claude button routes through Terminal.app for reliability.
- **Dock icon may not update immediately** on first install — a macOS icon cache quirk. `killall Dock` or reboot resolves it.

### Feedback

This is a release candidate precisely because the best bugs are found by other people. If you try Mycelium and something breaks, surprises you, or just feels off — please drop me a line at **halicon@gmail.com**. I'd rather hear it early than ship 1.0 with it still in there.

Particularly valuable feedback:
- Install New Vault flow — does it work on your machine?
- Terminal selection — does your preferred terminal show up in Settings? Does switching between them do the right thing?
- Light theme — anything unreadable, misaligned, or hard on the eyes?
- Anything that made you stop and think "wait, what?"

Thank you for trying it.

— halicon / neuromance
