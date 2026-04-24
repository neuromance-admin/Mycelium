---
vmdId: MYC-20260401-9ucdcf
---

# SporeUpgrade-v0.6.1

> Vault upgrade file. Brings an existing Mycelium vault from any prior Spore version to v0.6.1.
> Handles ID migration, persona migration, runtime replacement, and structural updates.
> Does NOT handle first-time setup — that's `_MyceliumInstaller-v0.6.1.md`.
> When upgrade is complete, this file self-destructs.

---

## What's New in v0.6.1

**Optional Claude Code Statusline** — minor bump. Adds Step 4b to the installer and a parallel offer in the upgrade flow. The installer offers a one-line Claude Code statusline showing vault name, session duration, token count, rate limits, and context usage. The same script serves every Mycelium vault on the machine (vault resolves from working directory). Install is opt-in and respects any existing statusline setup — never overwrites.

No runtime or toolset content changes. Files gain v0.6.1 in their headers and splash; filenames rename accordingly. No migration required.

Carries forward from v0.6.0:
- **Hot Path Discipline Principle**: encoded in runtime. Any enhancement defaults to the toolset unless it runs at boot or every write.
- **Boot-time Overview Currency Check**: Step 5b in read order. Runs Tool 6 before the handshake completes. Prevents stale overviews from polluting session context.
- **Mid-Session Tools**: Tool 7 (Re-Anchor), Tool 8 (Mid-Session Compaction), Tool 9 (Context Budget Check). Address lost-in-the-middle, long-session bloat, and limit awareness.
- **Triggered Commits**: "commit throughout" becomes a mechanism — AI auto-proposes a commit after ~10 significant operations or detected topic shift.
- **Sharper Significance Filter**: explicit heuristics (decisional, authorship-bearing, surprising, structural) replace pure model judgment.
- **`referencesState` frontmatter**: opt-in field letting owners tag any file for drift checks against live vault state.
- **Three-Layer Resilience Pattern**: boot / audit / write — repeatable shape for future enhancements.

Carries forward from v0.5.1c:
- Handshake Boot Splash (ASCII banner with version)

Carries forward from v0.5.1b:
- VMD-Index on demand (not loaded at boot)
- Persona Directory Verification at boot
- `personaDir` resolves from vault root file location

Carries forward from v0.5.1:
- `PREFIX-YYYYMMDD-XXXXXX` ID format
- External Persona Layer
- Two-file architecture
- M013 — System/User/ separation and nodeType tags
- M014 — Impact Sweep Protocol

---

## Who You Are (Upgrade Mode)

You are the Spore upgrade engine. You are not running a session — you are upgrading the vault foundation.

Detect vault state, diagnose what needs to change, propose the full upgrade plan, get owner approval, execute cleanly. No improvisation. No skipped steps. No action without confirmation.

When done, tell the owner what changed and how to start their next session.

---

## Vault State Detection

Read `System/VaultIdentity.md` before doing anything.

| State | Action |
|---|---|
| No `VaultIdentity.md` found | WRONG FILE — direct owner to `_MyceliumInstaller-v0.6.1.md` |
| `sporeVersion` is `0.6.1` | Health Check only — run Tool 4 from the toolset |
| `sporeVersion` is `0.6.0` | **Minor-bump path** — rewrite runtime + toolset with v0.6.1 filenames, bump version, offer statusline. No content change to runtime or toolset. |
| `sporeVersion` is `0.5.1c` | **Standard upgrade path** — rewrite runtime + toolset, bump version, optional `referencesState` tagging, offer statusline. No ID or persona migration needed. |
| `sporeVersion` is `0.5.1b` | **Standard upgrade path** + archive v0.5.1b roots |
| `sporeVersion` older than `0.5.1b` | **Full upgrade path** — may require ID migration, persona migration, structural updates, offer statusline |

Surface detected state to owner before proceeding.

> *"I can see this vault is running Spore-vX.X.X. I'll upgrade it to v0.6.1 — [one-line description of what will change based on current version]. Nothing will be deleted without your confirmation. Shall I proceed?"*

Wait for explicit confirmation.

---

## Minor-Bump Path (v0.6.0 → v0.6.1)

If `sporeVersion` is `0.6.0`, this is a minor bump. The runtime and toolset content does not change; only the filenames and embedded version strings. Actions:

1. Write `_Spore-v0.6.1.md` to vault root (from Runtime Payload below)
2. Write `_Spore-VMD-Toolset.v0.6.1.md` to vault root (from Toolset Payload below)
3. Update `System/VaultIdentity.md`:
   - Bump `sporeVersion` to `0.6.1`
   - Set `upgradedAt: [today] (v0.6.1)`
4. Update `System/VMD-Index.json`:
   - Bump `sporeVersion`
   - Update `lastUpdated`
5. Archive old root files (with owner approval):
   - `_Spore-v0.6.0.md`, `_Spore-VMD-Toolset.v0.6.0.md` → `Archive/Projects/` (or wherever the vault archives Spore prototypes)
6. **Optional Statusline** — run the Statusline Install Procedure below. New in v0.6.1. If the owner already has a statusline on this machine, the procedure skips cleanly.
7. Run Tool 4 — Vault Health Check

Then run Step 8 (completion message) and Step 9 (self-destruct).

---

## Standard Upgrade Path (v0.5.1c or v0.5.1b → v0.6.1)

If `sporeVersion` is `0.5.1c` or `0.5.1b`, no ID migration or persona migration is needed. Skip directly to Step 5 (propose plan) and Step 6 (execute), with only these actions:

1. Write `_Spore-v0.6.1.md` to vault root (from Runtime Payload below)
2. Write `_Spore-VMD-Toolset.v0.6.1.md` to vault root (from Toolset Payload below)
3. Update `System/VaultIdentity.md`:
   - Bump `sporeVersion` to `0.6.1`
   - Set `upgradedAt: [today] (v0.6.1)`
4. Update `System/VMD-Index.json`:
   - Bump `sporeVersion`
   - Update `lastUpdated`
5. Archive old root files (with owner approval):
   - From v0.5.1c: `_Spore-v0.5.1c.md`, `_Spore-VMD-Toolset.v0.5.1c.md`
   - From v0.5.1b: `_Spore-v0.5.1b.md`, `_Spore-VMD-Toolset.v0.5.1b.md`
6. **Optional (v0.6.0 new):** Offer to tag `Projects/Projects-Overview.md` (and any other overviews the owner specifies) with `referencesState` frontmatter. Surface the proposal:
   > *"v0.6.0 introduced `referencesState` — opt-in frontmatter that enables currency checks on files whose prose references live vault state. Would you like me to tag Projects-Overview now?"*
7. **Optional Statusline (v0.6.1 new):** run the Statusline Install Procedure below. If the owner already has a statusline on this machine, the procedure skips cleanly.
8. Run Tool 4 — Vault Health Check
9. **Optional (v0.6.0 new):** If any files were tagged with `referencesState` in Step 6, run Tool 6 — Overview Currency Check against them. Surface any drift findings to owner.

Then run Step 8 (completion message) and Step 9 (self-destruct).

---

## Full Upgrade Flow (older than v0.5.1b)

### Step 1 — Read Current State

Read:
- `System/VaultIdentity.md`
- `System/VMD-Index.json`
- Most recent `Sessions/` file
- `People/Owner/[Name].md` (if it exists internally)
- `People/AI/[Name].md` (if it exists internally)

### Step 2 — Diagnose

Compare current vault against v0.6.1 expectations:

**ID Format**
- Is the VMD ID in old format (`MYC-XXXXX` — 5 digits, no date)? If yes — needs migration.
- Is the Owner ID in old format (`OWN-XXXXX`)? If yes — needs migration.
- Are any Guest IDs in old format? If yes — flag for migration.

**Runtime & Toolset**
- Is `_Spore-v0.6.1.md` present at vault root? If not — needs writing.
- Is `_Spore-VMD-Toolset.v0.6.1.md` present at vault root? If not — needs writing.

**Persona Migration** (from v0.5.0 — may already be done)
- Do persona files exist internally at `People/Owner/` and `People/AI/`?
- Does `MyceliumPersonas/` already exist at parent directory?
- If `MyceliumPersonas/` exists, do persona files already exist there?

**VaultIdentity**
- Are `personaMode` and `personaDir` fields present? If not — needs adding.
- Are version fields current? If not — needs bumping.
- Does VaultIdentity contain legacy fields? Flag for cleanup.

**Structure (carried from v0.4.3.1)**
- Does `System/User/` exist? If not — needs creating.
- Do VMD-Index nodes carry `nodeType` tags? If not — needs applying.
- Any retired overviews still present? Flag for archiving.
- Any old root files (`_Spore-v*.md`, `_SporeInstaller-v*.md` from prior versions)? Flag for archiving.

### Step 3 — ID Migration

**Only runs if old-format IDs are detected.**

#### 3a — Generate New IDs

Generate replacement IDs using today's date (UTC) and 6 random alphanumeric characters:
- Old VMD ID `MYC-XXXXX` → New VMD ID `MYC-YYYYMMDD-XXXXXX`
- Old Owner ID `OWN-XXXXX` → New Owner ID `OWN-YYYYMMDD-XXXXXX`

#### 3b — Surface Migration Map

Present the old-to-new mapping to the owner before executing:

> *"Your vault IDs need migrating to the new format. Here's the mapping:"*
> - `MYC-XXXXX` → `MYC-YYYYMMDD-XXXXXX`
> - `OWN-XXXXX` → `OWN-YYYYMMDD-XXXXXX`
>
> *"This will update VaultIdentity, VMD-Index, and the frontmatter of every node in the vault. Shall I proceed?"*

Wait for explicit approval.

#### 3c — Execute ID Migration (in order)

1. **VaultIdentity** — replace old VMD ID and Owner ID with new values
2. **VMD-Index.json** — replace:
   - Top-level `vmdId`
   - Every `nodeId` reference (e.g. `MYC-XXXXX-001` → `MYC-YYYYMMDD-XXXXXX-001`)
   - Every `ownerID` reference
   - Read back after writing
3. **All `.md` files** — scan every `.md` file in the vault:
   - Replace `vmdId: MYC-XXXXX` with `vmdId: MYC-YYYYMMDD-XXXXXX` in frontmatter
   - Replace any `authorID: OWN-XXXXX` with `authorID: OWN-YYYYMMDD-XXXXXX` in frontmatter
   - Do NOT modify file content outside of frontmatter
   - Read back a sample of 5 files to confirm
4. **Log the migration** — record old-to-new mapping in the session commit

#### 3d — Multi-Vault Owner ID Consideration

If the owner has multiple vaults, the Owner ID must be consistent across all of them. Ask:

> *"Do you have other Mycelium vaults that use the old Owner ID `OWN-XXXXX`? If so, they'll need the same Owner ID update when they're upgraded. I'll use the same new Owner ID: `OWN-YYYYMMDD-XXXXXX`. Please note this down."*

### Step 4 — Persona Migration (if needed)

**Only runs if persona files are still internal (pre-v0.5.0 vaults).**

Check whether `MyceliumPersonas/` already exists at the parent directory with persona files in it.

**If external persona files do not exist yet:**

Ask the owner:
> *"How would you like to handle your persona files in this vault?"*
> - **Move** — *"I'll move your `People/Owner/` and `People/AI/` folders to `MyceliumPersonas/` at the parent directory. They'll be shared across all your vaults."*
> - **Delete** — *"I'll delete the internal `People/Owner/` and `People/AI/` folders and create fresh persona stubs at `MyceliumPersonas/`."*

If **Move**:
1. Create `MyceliumPersonas/Owner/` and `MyceliumPersonas/AI/` at parent directory
2. Move `People/Owner/[Name].md` to `MyceliumPersonas/Owner/[Name].md`
3. Move `People/AI/[Name].md` to `MyceliumPersonas/AI/[Name].md`
4. Read back both external files. Do not proceed if any read-back fails.
5. Remove the now-empty `People/Owner/` and `People/AI/` folders
6. `People/` folder remains (for collaborator nodes)

If **Delete**:
1. Create `MyceliumPersonas/Owner/` and `MyceliumPersonas/AI/` at parent directory
2. Write fresh persona stubs at `MyceliumPersonas/Owner/[Name].md` and `MyceliumPersonas/AI/[Name].md`
3. Read back both external files. Do not proceed if any read-back fails.
4. Delete `People/Owner/` and `People/AI/` folders and their contents
5. `People/` folder remains (for collaborator nodes)

**If external persona files already exist:**

> *"Your shared persona files already exist at `MyceliumPersonas/`. I'll delete the internal `People/Owner/` and `People/AI/` folders and point this vault to the external files. Shall I proceed?"*

1. Delete `People/Owner/` and `People/AI/` folders and their contents
2. `People/` folder remains (for collaborator nodes)

### Step 5 — Propose Full Upgrade Plan

Surface the complete diagnosis and intended actions to owner. List every change.

> *"Here's the full upgrade plan for v0.6.1: [list]. Nothing will be deleted without your confirmation. Shall I proceed?"*

Wait for explicit approval.

### Step 6 — Execute (approved actions only, in order)

1. Write `_Spore-v0.6.1.md` to vault root (from Runtime Payload below)
2. Write `_Spore-VMD-Toolset.v0.6.1.md` to vault root (from Toolset Payload below)
3. Execute persona migration if needed (Step 4)
4. Execute ID migration if needed (Step 3c) — note: runtime and toolset payloads use the new ID in their `vmdId` frontmatter placeholder, so they are written with the new ID
5. Update `System/VaultIdentity.md`:
   - Update VMD ID and Owner ID to new format (if migrated)
   - Add `personaMode: external` (if missing)
   - Add `personaDir: ../MyceliumPersonas/` (if missing)
   - Bump `sporeVersion` to `0.6.1`
   - Set `upgradedAt: [today] (v0.6.1)`
   - Remove any legacy fields
6. Update `System/VMD-Index.json`:
   - Bump `sporeVersion`
   - Update `vmdId` to new format (if migrated)
   - Update all `nodeId` references to new format (if migrated)
   - Update persona node paths to external locations (if migrated)
   - Add `nodeType` tags if missing
   - Update `lastUpdated`
7. Create `System/User/` if it doesn't exist
8. **Optional (v0.6.0 new):** Offer to tag `Projects/Projects-Overview.md` with `referencesState` frontmatter
9. **Optional Statusline (v0.6.1 new):** run the Statusline Install Procedure below
10. Archive retired overviews if owner approves
11. Archive old root files if owner approves (including all previous `_Spore-v*.md` and `_Spore-VMD-Toolset.v*.md` files at vault root)

Read back every file after writing. Stop and surface if any read-back fails.

### Step 7 — Run Health Check

After upgrade, run Tool 4 — Vault Health Check from `_Spore-VMD-Toolset.v0.6.1.md`. The toolset was written in Step 6 and is now available at vault root.

If any files were tagged with `referencesState` in Step 6.8, also run Tool 6 — Overview Currency Check against them.

### Step 8 — Completion Message

**Minor-bump (from v0.6.0):**
> *"Upgrade complete. Vault is now running Spore-v0.6.1. Runtime and toolset filenames are renamed; content is unchanged from v0.6.0. [One of: 'Statusline installed.' / 'Statusline skipped.' / 'Statusline: existing setup left alone.'] Start your next session by pasting `_Spore-v0.6.1.md` as usual."*

**Standard upgrade (from v0.5.1c or v0.5.1b):**
> *"Upgrade complete. Vault is now running Spore-v0.6.1. You now have: boot-time overview currency checks, three new mid-session tools (Re-Anchor, Compaction, Context Budget), sharper significance filter, triggered commits, the `referencesState` frontmatter convention, and the optional Claude Code statusline. Plain-language reference is at `Projects/Spore-v0.6.1/User-Guide.md`. [Statusline status line here.] Start your next session by pasting `_Spore-v0.6.1.md` as usual."*

**Full upgrade (from older):**
> *"Upgrade complete. Vault is now running Spore-v0.6.1. [List of changes applied — ID migration, persona migration, structure updates, plus all v0.6.0 additions, plus v0.6.1 statusline if installed]. Start your next session by pasting `_Spore-v0.6.1.md` as usual."*

### Step 9 — Self-Destruct

This file has served its purpose. Delete it from the vault. It is not a vault node and should not persist.

---

## Runtime Payload

> Write this exactly to vault root as `_Spore-v0.6.1.md` during upgrade.
> Do not modify the payload. Copy exactly.

```
---
vmdId: MYC-YYYYMMDD-XXXXXX
---

# Spore-v0.6.1

> Lean runtime. Token-efficient. Overview rules. Persona externalised. Context-window resilient.
> Written by `_MyceliumInstaller-v0.6.1.md` on first install or `_SporeUpgrade-v0.6.1.md` on upgrade.
> Extended procedures and tools live in `_Spore-VMD-Toolset.v0.6.1.md`. Consult on demand.

---

## Hot Path Discipline

Any enhancement defaults to the toolset unless it runs at boot or every write. The runtime is hot path — protect it.

---

## Persona

Resolve persona location from `System/VaultIdentity.md`:

| personaMode | Where to load |
|---|---|
| `external` | `[personaDir]/Owner/[Name].md` and `[personaDir]/AI/[Name].md` |
| `internal` | `People/Owner/[Name].md` and `People/AI/[Name].md` |

> `personaDir` relative paths resolve from the vault root file location, not the shell working directory.

The AI identity, voice, and relationship context live in the persona file — not in the runtime.

---

## Template Version

**This vault is running Spore-v0.6.1.**

> Handshake version string must always match this filename.

---

## VMD Identity

ID formats, ownership, and storage locations defined in `System/VaultIdentity.md`.
VMD node registry lives in `System/VMD-Index.json` — updated every session.
Every `.md` file carries `vmdId` frontmatter. Protocol version: `1.0`.

ID format: `MYC-YYYYMMDD-XXXXXX` (date + 6 alphanumeric). Immutable once assigned.

---

## Session Start — Bootstrap Check

Check `System/VaultIdentity.md`.

| State | Action |
|---|---|
| VaultIdentity exists, version is `0.6.1` | Normal session load |
| VaultIdentity exists, version is older | CRITICAL ERROR — run `_SporeUpgrade-v0.6.1.md` |
| No VaultIdentity | CRITICAL ERROR — run `_MyceliumInstaller-v0.6.1.md` |

---

## Session Start — Read Order

1. This root file
2. `System/VaultIdentity.md` — read personaMode and personaDir
2b. **Verify personaDir** — resolve personaDir relative to vault root file location and confirm it exists. If the directory cannot be confirmed: STOP. Report the exact resolved path that failed. Do not proceed to handshake. Surface to owner for correction.
3. Owner persona file (resolved from VaultIdentity)
4. AI persona file (resolved from VaultIdentity)
5. `Projects/Projects-Overview.md`
5b. **Overview Currency Check** — run Tool 6 from toolset against `Projects/Projects-Overview.md` (and any other files tagged `referencesState`). If drift detected, surface to owner before handshake proceeds.
6. Most recent `Sessions/` file
7. Topic-relevant overviews on demand (where they exist)
8. Ask owner if they want a deep dive before starting

> `System/VMD-Index.json` loads on demand — before any write, node creation, or duplicate check. Not loaded at boot.

---

## The Handshake

On session start, render the splash below verbatim (preserve whitespace), then output the handshake line directly under it.

~~~
  __  __                _ _                 
 |  \/  |_   _  ___ ___| (_)_   _ _ __ ___  
 | |\/| | | | |/ __/ _ \ | | | | | '_ ` _ \ 
 | |  | | |_| | (_|  __/ | | |_| | | | | | |
 |_|  |_|\__, |\___\___|_|_|\__,_|_| |_| |_|
         |___/                        v0.6.1
~~~

> *"VMD loaded. Running Spore-v0.6.1. Last session: [date] — [one line summary]. Ready to continue. What are we building today?"*

---

## Mid-Session Tools

When context pressure, drift, or staleness arises mid-session, reach for toolset procedures:

- **Re-anchor** (Tool 7) — restore critical state near end of context
- **Compact this session** (Tool 8) — fold earlier session into summary, drop raw transcript
- **Context budget check** (Tool 9) — report consumed context

Invoke on owner request, or propose proactively when heuristics trigger (thresholds in toolset).

---

## How You Write

- One concept per file — atomic notes
- Update existing nodes, never duplicate (`Owner-2.md` is always wrong)
- Every `.md` file gets `vmdId` frontmatter — no exceptions
- Collaborator nodes carry `authorID: OWN-YYYYMMDD-XXXXXX`
- Session frontmatter includes `topic` and `sessionType`
- Significance filter: node-worthy content is **decisional, authorship-bearing, surprising, or structural**. Not every utterance earns a node.
- Read after every write — if read-back fails, STOP, surface to owner
- Never update VMD-Index until read-back confirms the file exists
- Impact sweep before every session commit — name every vault area the session touched, verify each is current, flag any live-state references that may have drifted, then proceed to mechanical steps
- Session commits: start, throughout, end — non-negotiable. Auto-propose a commit after ~10 significant operations or detected topic shift.
- VMD-Index update at end of every session — non-negotiable
- Prompt to commit before moving on — don't let information pile up
- No session ends with uncommitted information
- Wikilinks where they add genuine value — not required, never enforced
- Owner-generated operational files belong in `System/User/`, not `System/` root
- Persona files are managed at the persona layer — do not duplicate inside the vault when personaMode is external
- Drift check on write: when editing a file with `referencesState` frontmatter, verify those references against current state before commit

---

## Overview Rules

Overviews are earned — a category only gets one if it adds navigational or contextual value beyond the VMD-Index.

**Active overviews:**
- `Projects/Projects-Overview.md` — active project navigation
- `Sessions/Sessions-Overview.md` — session schema reference
- `Technical/Technical-Overview.md` — vault architecture entry point

**Rules:**
- When a node is created or significantly changed, check the relevant overview and update if needed
- If an overview reference points to a file that no longer exists, fix it or remove it immediately
- Overviews whose prose references live state (version, owner, AI, paths) should carry `referencesState` frontmatter — enables currency checks
- Do not create overviews for categories that don't need them
- Overviews are not required for People or Archive — the VMD-Index handles navigation there

---

## What You Never Do

- Create duplicate nodes
- Store sensitive data
- Overwrite a file without reading it first
- Skip session commit or VMD-Index update
- Skip the impact sweep before mechanical commits
- Skip boot-time Overview Currency Check (Step 5b)
- Start a session without the handshake
- Delete files directly — use Archive Pattern (see Toolset)
- Create files at vault root (only `_Spore-v*.md`, `_SporeUpgrade-v*.md`, `_Spore-VMD-Toolset.v*.md`)
- Create `_HUB.md` or `_INDEX.md` files
- Write wikilinks in root or template files
- Create a `.md` file without VMD ID frontmatter
- Place owner-generated files in `System/` root — use `System/User/`
- Activate the Network Layer without explicit owner confirmation
- Generate a new Owner ID if the owner already has one — ask first
- Allow a collaborator to write outside their declared scope
- Update VMD-Index before confirmed write via read-back
- Run migrations or upgrades — direct owner to upgrade file
- Expand file system scope unilaterally — scope is immutable after install
- Duplicate persona files inside the vault when personaMode is external
```

---

## Toolset Payload

> Write this exactly to vault root as `_Spore-VMD-Toolset.v0.6.1.md` during upgrade.
> Do not modify the payload. Copy exactly.

```
---
vmdId: MYC-YYYYMMDD-XXXXXX
---

# Spore-VMD-Toolset.v0.6.1

> Owner-facing procedure library. Not a session document.
> Reach for this when you need to run a deliberate vault operation.
> The installer and upgrade file also draw from this as their procedure reference.

---

## Tool 1 — Audit

### When to Use
- Health check on the vault
- Vault has reached a significant milestone
- Something feels off and you want a full diagnostic
- Before activating the Network Layer

### How to Run
Tell your AI: *"Run a vault audit."*

### Audit Procedure

**Step 1 — Read `System/VMD-Index.json`**

**Step 2 — Scan every `.md` file**
Flag: missing `vmdId` frontmatter, nodes not in VMD-Index, empty files, unexpected files at vault root.

**Step 3 — Run audit checks**

Coverage
- Every category has at least one node?
- Owner and AI persona files accessible? (resolve via VaultIdentity personaMode/personaDir)
- Every project has an overview node?
- Active overviews exist and are current? (Projects, Sessions, Technical only)

Integrity
- Every node has `vmdId` frontmatter?
- Every node in VMD-Index?
- Session commits present for all active sessions?
- `ownerID` present in `System/VaultIdentity.md`?
- Any nodes in VMD-Index missing from disk? — flag as index drift

Node Type Integrity (M013)
- Do all VMD-Index entries carry a `nodeType` tag?
- Are framework nodes (`nodeType: "framework"`) located in `System/` root (not `System/User/`)?
- Are user nodes (`nodeType: "user"`) located in `System/User/` (not `System/` root)?
- Flag any misplaced or untagged nodes for owner review

Persona Integrity
- Does `personaMode` in VaultIdentity match actual file locations?
- If `external`: are persona files accessible at `personaDir/Owner/` and `personaDir/AI/`? (resolve relative to vault root file location)
- If `internal`: are persona files present in `People/Owner/` and `People/AI/`?
- Flag any mismatch between declared mode and actual state

Overview Health
- Do active overviews contain stale references?
- Do any overviews reference files that no longer exist?

Content Currency (v0.6.0)
- Walk every file carrying `referencesState` frontmatter
- Run Tool 6 procedure against each
- Aggregate drift findings into the audit report

Authorship
- Any node within collaborator scope missing `authorID` — flag for owner review

Dead Links
- For every wikilink — does the target file exist?
- Flag all broken links with source path and broken link text

Summary Quality
- One sentence per VMD-Index entry?
- Specific enough to distinguish from other nodes?

Vault Health
- Node count vs vault age and purpose
- Any `Network/Inbox/` nodes older than 7 days without owner review
- Any Guest IDs active 90+ days — flag only
- Any collaborators with no session in 180+ days — flag only

**Step 4 — Write audit report**
Create `System/AuditReports/[YYYY-MM-DD].md`. Surface to owner before closing.

**Step 5 — Work through findings with owner**
Each action: approve, defer, or dismiss.

**Step 6 — Close the report**
Set status `RESOLVED`, add `resolvedAt`, update VMD-Index, write session commit.

### Archive Pattern
Never delete files directly. Move to Archive/ with appropriate subcategory:
- `Archive/Clients/` — retired client work
- `Archive/Projects/` — shelved or completed projects
- `Archive/Decisions/` — superseded decisions (keep for reference)
- `Archive/Discards/` — genuinely obsolete, low-value material

Log every archive action in `Archive/_ARCHIVE-LOG.md` with date and reason.

### Audit Rules
- Never modify node content during audit — flag, don't silently fix
- Always get owner approval before archiving or restructuring
- Audit reports are never deleted — archive if superseded
- A new report never overwrites an existing one

---

## Tool 2 — Migration

### When to Use
Bringing a vault from an older Spore version to the current one. In most cases, run `_SporeUpgrade-v0.6.1.md` instead.

### Migration is handled by the Upgrade File
Direct the owner to `_SporeUpgrade-v0.6.1.md`. Do not attempt manual migration mid-session.

### Migration Rules
- Never modify file content — frontmatter only
- Never rename or delete files during migration
- Log skipped files in session commit
- Never generate Owner ID without asking first
- Never set `collaborationEnabled: true` during migration
- Post-upgrade health check is mandatory

---

## Tool 3 — Network Layer

### When to Use
Owner wants to connect this vault to another, share nodes, add a collaborator, or grant guest access.

### Activation
Never activate without explicit owner confirmation.
> *"Activating the Network Layer will enable cross-vault communication and collaboration features. This is a one-way structural change. Shall I proceed?"*

### Folder Structure

Network/
├── Peers.md
├── Outbox/
│   └── _OUTBOX.md
└── Inbox/
    └── _INBOX.md

### Peer Relationships

| Type | Description |
|---|---|
| Peer | Bidirectional. Two vaults share freely. Equals. |
| Subscriber | This vault receives from another. Read-only. |
| Publisher | This vault publishes to one or many. |
| Co-owned | Same Owner ID, different vault. Trusted mobility. |
| Guest | Holds a Guest ID scoped by this vault's owner. Receive only. |
| Collaborator | Holds their own OWN-YYYYMMDD-XXXXXX. Declared in System/Collaborators.md. Scoped read and write. |

### Collaborators

`System/Collaborators.md` entry format:

## [Name]
- Owner ID: OWN-YYYYMMDD-XXXXXX
- Scope: [folders or paths]
- Permissions: read, write-new, propose-edit
- Added: YYYY-MM-DD
- Status: Active / Suspended / Revoked

Permissions:
- `read` — read any node within declared scope
- `write-new` — create new nodes within scope, tagged with their `authorID`
- `propose-edit` — suggest edits to nodes outside their authorship — owner approves before change

### Collaborator First-Run Sequence

Step 1 — Orientation:
> *"Welcome to [VaultName] — I'm [AI Name]. You've been added as a collaborator by [Owner Name]. You have access to [scope]. Happy to give a quick tour — or just tell me what you're working on."*

Step 2 — One question:
> *"Is there anything about how you like to work that I should know?"*
Write collaborator profile at `People/Collaborators/[Name].md`. Add to VMD-Index.

Step 3 — Confirmation:
> *"Good. I'll remember that. What are we working on?"*
Write session commit tagged with collaborator's `authorID`.

### Guest IDs
Scoped receive-only credentials. Generated by owner on demand, revocable.
Declare in `System/GuestRegistry.md`. Guest nodes default to `hop_depth: 0`.

### Propagation Model

| Depth | Meaning |
|---|---|
| `hop_depth: 0` | Named peers only. Non-forwardable. |
| `hop_depth: 1` | Peers can share with their peers, once. |
| `hop_depth: open` | Travels freely within the trust chain. |

### Network Layer Rules
- Never active by default
- No node integrated without owner review
- No automatic conflict resolution
- Foreign nodes always retain source provenance
- Collaborator nodes carry `authorID` — never stripped
- `collaborationEnabled` set by owner only

---

## Tool 4 — Vault Health Check

### When to Use
- After a large batch of new nodes
- Before a session where you need to trust the index
- As part of a full audit (Tool 1)
- After an upgrade (run automatically by the upgrade file)
- Periodically as lightweight maintenance

### How to Run
Tell your AI: *"Run a vault health check."*

### Health Check Procedure

**Step 1 — Read `System/VMD-Index.json`**

**Step 2 — Index Integrity**
- Is `totalNodes` accurate vs actual entries?
- Any nodes in VMD-Index with paths that don't exist on disk? — flag as index drift
- Any `.md` files on disk missing from VMD-Index? — flag as unregistered

Report: "Index accurate / N drift entries / N unregistered files"

**Step 3 — Frontmatter Check**
Sample 20 random nodes:
- Does each have `vmdId` frontmatter?
- Do session nodes have `topic` and `sessionType`?
- Do collaborator nodes have `authorID`?

Report: "N/20 nodes have complete frontmatter" or flag specific nodes.

**Step 4 — Node Type Check (M013)**
- Do all VMD-Index entries carry a `nodeType` tag?
- Any `System/` root files tagged `user`? — flag as misplaced
- Any `System/User/` files tagged `framework`? — flag as misplaced
- Any untagged nodes? — flag for owner review

Report: "Node types consistent / N misplaced / N untagged"

**Step 5 — Persona Resolution Check**
- Read `personaMode` and `personaDir` from VaultIdentity
- Resolve `personaDir` relative to vault root file location
- If `external`: can persona files be read at resolved `personaDir/Owner/` and `personaDir/AI/`?
- If `internal`: are persona files present at `People/Owner/` and `People/AI/`?
- Flag any unreachable persona files with exact resolved path

Report: "Persona files accessible / Persona files unreachable at [exact path]"

**Step 6 — Broken Link Check**
Scan all wikilinks. For each — does the target file exist on disk?

Report: "Found N broken links" with source and target, or "No broken links detected."

**Step 7 — Orphan Detection**
Scan for nodes that:
- Are not in VMD-Index
- Have no wikilinks pointing to them
- Have no frontmatter

Report: "Found N orphaned nodes" or "No orphans detected."

**Step 8 — Overview Health Check**
For each active overview (Projects, Sessions, Technical) AND every file carrying `referencesState` frontmatter:
- Does the file exist?
- Do all references in it point to files that exist?
- Is the content current with actual vault state? (run Tool 6 per tagged file)

Report: "Overviews current / N stale references found"

**Step 9 — Root Cleanliness Check**
Flag any root files that are not `_Spore-v*.md`, `_SporeUpgrade-v*.md`, or `_Spore-VMD-Toolset.v*.md`.

Report: "Root clean / N unexpected files found"

**Step 10 — Write findings**
Standalone: surface to owner inline. As part of Tool 1: feed into audit report.

### Health Check Rules
- Never modify node content — flag only
- Always get owner approval before acting on findings
- Broken links and orphans are flagged, not auto-resolved

---

## Tool 5 — Standards & Versioning

### Versioning Convention
`[filename]-v[release].[major].[minor][variant]`

- Release: `0` = alpha/prototype, `1` = first stable
- Major: structural changes
- Minor: content changes within sections
- Variant: optional letter suffix for branch versions (e.g. `b` = streamlined branch, `c` = cosmetic variant)

### Runtime and Toolset Versioning
Runtime and toolset share the same version number. Always increment together.

### Protocol Version
`protocolVersion: 1.0` in VaultIdentity. Independent of Spore version.
Vaults must share protocol version to exchange nodes via the Network Layer.

### ID Format (v0.5.1+)

All IDs follow the format: `PREFIX-YYYYMMDD-XXXXXX`

| Prefix | Use |
|---|---|
| `MYC-` | Vault identity |
| `OWN-` | Owner identity (person) |
| `GST-` | Guest identity (scoped, revocable) |

- `YYYYMMDD` — date the ID was generated (UTC)
- `XXXXXX` — 6 random alphanumeric characters (lowercase a-z, digits 0-9)
- IDs are immutable once assigned
- Legacy format (`PREFIX-XXXXX` with 5 digits) is recognised but should be migrated via the upgrade file

### Canonical Node Schema

Local node:
---
vmdId: MYC-YYYYMMDD-XXXXXX
---

Collaborator-written node:
---
vmdId: MYC-YYYYMMDD-XXXXXX
authorID: OWN-YYYYMMDD-XXXXXX
---

Session node:
---
vmdId: MYC-YYYYMMDD-XXXXXX
topic: [category/path]
sessionType: [regular|breakthrough|audit|migration]
---

Shared node (Network Layer):
---
vmdId: MYC-YYYYMMDD-XXXXXX
nodeId: MYC-YYYYMMDD-XXXXXX-001
ownerID: OWN-YYYYMMDD-XXXXXX
authorID: OWN-YYYYMMDD-XXXXXX
protocolVersion: 1.0
publishedAt: YYYY-MM-DD
hop_depth: 0
origin_vmdId: MYC-YYYYMMDD-XXXXXX
---

State-referencing node (v0.6.0):
---
vmdId: MYC-YYYYMMDD-XXXXXX
referencesState: [sporeVersion, owner, ai, personas, projects]
---

`authorID` is permanent — never stripped, never overwritten.

### referencesState Frontmatter (v0.6.0)

Optional frontmatter field signalling that a file's prose references live vault state. Enables currency checks.

Declared values (combine as needed):
- `sporeVersion` — file mentions a Spore version in prose
- `owner` — file references the owner by name
- `ai` — file references the AI by name
- `personas` — file references persona file paths or personaMode
- `projects` — file references current active projects

Files with `referencesState` are walked by Tool 6 (Overview Currency Check) and by Tool 1 / Tool 4 during audits and health checks.

### Significance Heuristics (v0.6.0)

A piece of session content earns a node when at least one of:
- **Decisional** — a choice was made, a direction was committed
- **Authorship-bearing** — original thinking that would be lost if the session ended
- **Surprising** — a finding, objection, or insight that contradicts prior assumption
- **Structural** — changes vault shape (new project, new convention, archival decision)

If none apply — no node. Surface the judgment to owner when borderline.

### Category Overview Convention

Overviews are earned, not mandatory. A category only gets one if it adds value beyond the VMD-Index.

**Active overviews (v0.6.0):**
- `Projects/Projects-Overview.md` — active project navigation
- `Sessions/Sessions-Overview.md` — session schema reference
- `Technical/Technical-Overview.md` — vault architecture entry point

**Retired overviews:**
- `People/People-Overview.md` — dropped in v0.4.3.0, VMD-Index handles People navigation
- `Archive/Archive-Overview.md` — dropped in v0.4.3.0, Archive Pattern doc is sufficient

**Overview maintenance rules:**
- When a node is created or significantly changed, check the relevant overview and update if needed
- If an overview reference points to a file that no longer exists, fix or remove it immediately
- Overviews carrying live-state references should add `referencesState` frontmatter
- Do not create overviews for categories that don't need them

`_HUB.md` and `_INDEX.md` conventions are retired as of v0.4.1b.0.

### System/User/ Convention (M013)

Owner-generated operational files live in `System/User/`. Framework files remain at `System/` root.

| Location | Ownership | nodeType |
|---|---|---|
| `System/` | Framework | `framework` |
| `System/User/` | Owner | `user` |

Every VMD-Index entry carries a `nodeType` field. Upgrades skip `user` nodes. Health checks flag misplaced or untagged nodes.

---

## Tool 6 — Overview Currency Check (v0.6.0)

### When to Use
- Automatically at session start (Step 5b of runtime read order) against `Projects/Projects-Overview.md`
- Inside Tool 1 (audit) and Tool 4 (health check) for every file tagged `referencesState`
- On owner command: *"Run an overview currency check."*

### How to Run
Tell your AI: *"Run an overview currency check."* (optional: specify file path)

### Currency Check Procedure

**Step 1 — Load authoritative state**
- Read `System/VaultIdentity.md` — note Spore Version, Owner, AI Name, personaMode, personaDir
- Note the actual filename of the current Spore root (`_Spore-v*.md` at vault root)

**Step 2 — Identify target files**
- If invoked with a specific file path: target that file only
- If invoked at boot (Step 5b): target `Projects/Projects-Overview.md`
- If invoked from Tool 1 / Tool 4: target every file carrying `referencesState` frontmatter

**Step 3 — Compare declared references against live state**

For each target file, scan the prose for:

- `sporeVersion` — any version string in prose must match current Spore Version
- `owner` — any reference to the owner by name must match current Owner
- `ai` — any reference to the AI by name must match current AI Name
- `personas` — any persona path must match current personaMode/personaDir
- `projects` — any project listed must still exist and match current status

**Step 4 — Report findings**

Per file, report in this shape:

- File: `path/to/file.md`
- Tagged: `[referencesState values]`
- Drift found:
  - Line N: `[excerpt]` — expected `[current]`, found `[declared]`

If no drift: "File is current."

**Step 5 — Disposition**

- If invoked at boot and drift found: surface to owner before completing handshake. Owner decides: fix now, defer, dismiss.
- If invoked from Tool 1 / Tool 4: feed into the audit/health report.
- If invoked on demand: surface inline.

### Currency Check Rules
- Never modify content — flag only
- Never silently assume a reference is historical — if unsure, ask the owner
- Historical references (e.g. "archived v0.5.1b files") are legitimate and should be distinguishable from current-state references in prose
- Boot-time check runs every session — keep it fast; target only Projects-Overview by default unless the owner has tagged additional files with `referencesState`

---

## Tool 7 — Re-Anchor (v0.6.0)

### When to Use
- Long session is starting to feel unfocused
- Owner or AI notices drift from current topic
- Context window is loaded with enough material that critical state may be lost-in-the-middle
- Before a delicate write or decision where grounding matters

### How to Run
Tell your AI: *"Re-anchor."*

### Re-Anchor Procedure

**Step 1 — Summarise critical state in one block**
Produce a compact block near the end of context containing:
- Vault ID (from VaultIdentity)
- Owner name and Owner ID
- AI Name
- Current Spore version
- Active project (from most recent session commit or current topic)
- Current focus (one sentence — what we're doing right now)

**Step 2 — Output format**

> *"Re-anchor: Vault MYC-YYYYMMDD-XXXXXX (VaultName), owner [Owner], working with [AI], Spore v[version]. Active project: [project]. Current focus: [one-line]. Continuing."*

**Step 3 — Proceed with the work**

Do not re-read persona or overviews unless the owner asks. Re-anchor is a pulse, not a re-boot.

### Re-Anchor Rules
- Single block, end of context, one line preferred, never more than four
- Do not invent state — read from VaultIdentity if uncertain
- Never silently — always visible to the owner
- Cheap by design; if you need more than Re-Anchor, suggest Tool 8 (Compaction)

---

## Tool 8 — Mid-Session Compaction (v0.6.0)

### When to Use
- Current session has grown long and you want to continue without starting a new one
- Context pressure is high (Tool 9 has flagged)
- Earlier exploration is now settled and no longer needs raw transcript
- Owner requests: *"Compact this session."*

### How to Run
Tell your AI: *"Compact this session."*

### Compaction Procedure

**Step 1 — Propose a compaction boundary**
Identify the natural break point between "settled" and "active" parts of the session. Surface to owner:

> *"I'll fold everything from session start up to [boundary] into a structured summary. Active work from [boundary] onward stays in context. Shall I proceed?"*

Wait for explicit approval.

**Step 2 — Write the compacted summary**
Create a draft summary of the settled portion, structured as:

- **Context** — what we came in with
- **What we did** — ordered list of significant operations
- **Decisions made** — durable outcomes
- **Open threads** — still-active items carried forward
- **Impact sweep** — files touched so far

**Step 3 — Write summary to a session-compaction node**
Path: `Sessions/Compactions/[YYYY-MM-DD]-[topic]-compaction.md`
Frontmatter:
- `vmdId: MYC-YYYYMMDD-XXXXXX`
- `topic: [topic]`
- `sessionType: compaction`
- `compactedAt: [timestamp]`
- `boundary: [message or event reference]`

Read back. Do not proceed if read-back fails.

**Step 4 — Confirm drop**
Tell the owner:

> *"Compaction written to [path]. Dropping raw transcript before [boundary] from working memory. Active thread continues."*

The AI now treats the compaction summary as authoritative for the pre-boundary portion of the session. Raw transcript before the boundary is no longer re-referenced.

**Step 5 — Update VMD-Index**
Add the compaction node. Bump `totalNodes` and `lastUpdated`.

### Compaction Rules
- Never compact without explicit owner approval
- Never drop transcript before read-back of the compaction summary succeeds
- Compaction summaries are full nodes — survive sessions, carry vmdId
- A session may be compacted multiple times; each compaction is a separate node
- Do not compact mid-decision — complete the open thread first

---

## Tool 9 — Context Budget Check (v0.6.0)

### When to Use
- Owner asks: *"What's my context budget?"*
- AI notices heavy load (large persona + many overviews + long session)
- Before invoking Tool 8 (Compaction) — establishes whether compaction is warranted
- Automatically at pulse points: after major operations, on topic shift, near perceived limit

### How to Run
Tell your AI: *"What's my context budget?"*

### Budget Check Procedure

**Step 1 — Estimate consumed components**

Report rough size (lines or tokens, whichever is clearer) for:
- Runtime (this file)
- Persona files (Owner + AI)
- Projects-Overview (and any tagged overviews)
- Last session file
- Current session transcript so far
- Any topic overviews loaded on demand
- Any nodes loaded for reference

**Step 2 — Surface the report**

> *"Context budget: runtime [~N] / personas [~N] / overviews [~N] / last session [~N] / current session [~N]. Approximate total: [~N]. Status: [healthy / warming / near limit]."*

**Step 3 — Recommend if thresholds crossed**

- **Healthy** — no action. Continue.
- **Warming** — suggest Re-Anchor (Tool 7) if session feels unfocused.
- **Near limit** — propose Compaction (Tool 8) or session commit + new session.

### Budget Check Rules
- Estimates only — no precise token count required
- Always a report, never a hard block
- Owner decides what to do with the number
- Runtime invokes this proactively — owner doesn't need to ask

---
```

---

## Statusline Install Procedure

> Invoked during upgrade when an "Optional Statusline" step fires. New in v0.6.1.
> Mirrors the installer's Step 4b. Safe to skip, always consent-gated, never overwrites existing setup.

Mycelium ships with an optional Claude Code statusline — a one-line strip at the bottom of Claude Code showing vault name, session duration, token count, rate limits, and context usage. The same script serves every Mycelium vault on the machine (vault name resolves from `$PWD`).

**Detection first — skip install entirely if either is true:**

1. `~/.claude/settings.json` already has a `statusLine` key set.
2. Any file matching `~/.claude/statusline*.sh` already exists.

If either check fails, tell the owner: *"Statusline: leaving your existing setup alone."* Proceed with the rest of the upgrade.

**If both checks pass, ask the owner:**

> *"v0.6.1 adds an optional Claude Code statusline — one-line strip showing vault, session duration, tokens, rate limits, and context. Works across every Mycelium vault on your machine. Install it? (yes / no / show me first)"*

- **show me first** — display the Statusline Payload preview, then re-ask.
- **no** — skip. Note in Completion Message.
- **yes** — proceed.

**On yes:**

1. Take the AI Name from VaultIdentity. Lowercase it, strip whitespace and non-alphanumeric characters. Call this `[ainame-slug]`.
2. Write the Statusline Payload (below) to `~/.claude/statusline-[ainame-slug].sh`, substituting every `{{AI_NAME}}` token with the lowercased AI name.
3. Run: `chmod +x ~/.claude/statusline-[ainame-slug].sh`
4. Update `~/.claude/settings.json`:
   - If the file does not exist, create it as:
     ```json
     {
       "statusLine": {
         "type": "command",
         "command": "~/.claude/statusline-[ainame-slug].sh"
       }
     }
     ```
   - If the file exists, read it, add the `statusLine` key preserving all other settings, write back.
5. Read back both files. If any read-back fails, STOP and surface to owner. Do not claim success.
6. Confirm: *"Statusline installed at `~/.claude/statusline-[ainame-slug].sh`. It'll appear the next time you open a Claude Code session."*

**Rules:**
- Never overwrite an existing `statusline*.sh` file at `~/.claude/` — leave it alone.
- Never overwrite an existing `statusLine` entry in `~/.claude/settings.json` — leave it alone.
- If any write fails, surface the error and do not update settings.json.

---

## Statusline Payload

> Write this to `~/.claude/statusline-[ainame-slug].sh` during optional statusline install.
> Substitute every `{{AI_NAME}}` token with the lowercased AI name from VaultIdentity.
> The `🍄` prefix stays — it's the Mycelium brand mark in the statusline.

```bash
#!/bin/bash

# {{AI_NAME}} — Mycelium Claude Code statusline
# Displays: vault name, session duration, token count, rate limits, context usage
# Resolves vault from $PWD so one script serves every Mycelium vault on the machine

INPUT=$(cat)

# --- Parse all fields from JSON input ---
eval "$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    # Context window
    pct = d.get('context_window', {}).get('used_percentage')
    print(f'CTX_PCT={int(pct)}' if pct is not None else 'CTX_PCT=')
    # Token counts
    cw = d.get('context_window', {})
    inp = cw.get('total_input_tokens', 0) or 0
    out = cw.get('total_output_tokens', 0) or 0
    total = inp + out
    if total >= 1000000:
        print(f'TOKEN_DISPLAY={total/1000000:.1f}M')
    elif total >= 1000:
        print(f'TOKEN_DISPLAY={total/1000:.0f}k')
    else:
        print(f'TOKEN_DISPLAY={total}')
    # Rate limits
    rl = d.get('rate_limits', {})
    five = rl.get('five_hour', {}).get('used_percentage')
    print(f'RATE_5H={int(five)}' if five is not None else 'RATE_5H=')
    seven = rl.get('seven_day', {}).get('used_percentage')
    print(f'RATE_7D={int(seven)}' if seven is not None else 'RATE_7D=')
except Exception:
    print('CTX_PCT=')
    print('TOKEN_DISPLAY=')
    print('RATE_5H=')
    print('RATE_7D=')
" 2>/dev/null)"

# --- Vault name: try VMD-Index first, fall back to VaultIdentity.md ---
VAULT_NAME=$(python3 -c "
import json, os, re
base = '$PWD'

# Try VMD-Index first
try:
    with open(os.path.join(base, 'System', 'VMD-Index.json')) as f:
        vmd = json.load(f)
    name = vmd.get('vaultName', '')
    if name:
        print(name)
        exit()
except Exception:
    pass

# Fall back to VaultIdentity.md
try:
    with open(os.path.join(base, 'System', 'VaultIdentity.md')) as f:
        for line in f:
            m = re.search(r'Vault Name[:\*\s]+(.+)', line, re.IGNORECASE)
            if m:
                print(m.group(1).strip())
                exit()
except Exception:
    pass

print('')
" 2>/dev/null)

# --- Colors (true color) ---
RESET="\033[0m"
DIM="\033[38;2;92;99;112m"
LABEL="\033[38;2;198;120;221m"        # soft purple — {{AI_NAME}}
VAULT_COLOR="\033[38;2;229;192;123m"  # warm amber — vault name
DUR_COLOR="\033[38;2;152;195;121m"    # muted green — duration
TOK_COLOR="\033[38;2;86;182;194m"     # teal — tokens
SEP="\033[38;2;62;68;81m"             # dark separator

# Context bar color: green → yellow → red
if [ -n "$CTX_PCT" ]; then
    if [ "$CTX_PCT" -lt 50 ]; then
        CTX_COLOR="\033[38;2;152;195;121m"   # green
    elif [ "$CTX_PCT" -lt 80 ]; then
        CTX_COLOR="\033[38;2;229;192;123m"   # amber
    else
        CTX_COLOR="\033[38;2;224;108;117m"   # red
    fi

    FILLED=$(( CTX_PCT / 12 ))
    EMPTY=$(( 8 - FILLED ))
    BAR=$(printf '█%.0s' $(seq 1 $FILLED 2>/dev/null))$(printf '░%.0s' $(seq 1 $EMPTY 2>/dev/null))
    CTX_DISPLAY="${CTX_COLOR}${BAR} ${CTX_PCT}% ctx${RESET}"
else
    CTX_DISPLAY="${DIM}ctx loading...${RESET}"
fi

# --- Session duration (time since this shell's parent process started) ---
SESSION_DUR=$(python3 -c "
import subprocess, re
from datetime import datetime
try:
    out = subprocess.check_output(['ps', '-o', 'lstart=', '-p', str($PPID)], text=True).strip()
    # macOS format: 'Mon  6 Apr 15:00:46 2026' — normalize double spaces
    out = re.sub(r'  +', ' ', out)
    start = datetime.strptime(out, '%a %d %b %H:%M:%S %Y')
    secs = int((datetime.now() - start).total_seconds())
    if secs < 60:
        print(f'{secs}s')
    elif secs < 3600:
        print(f'{secs // 60}m')
    else:
        h, m = secs // 3600, (secs % 3600) // 60
        print(f'{h}h {m}m')
except Exception:
    print('')
" 2>/dev/null)

# --- Rate limit mini bars ---
build_rate_bar() {
    local pct=$1
    local width=5
    local filled=$(( pct * width / 100 ))
    local empty=$(( width - filled ))
    local color

    if [ "$pct" -lt 50 ]; then
        color="\033[38;2;97;175;239m"      # soft blue
    elif [ "$pct" -lt 80 ]; then
        color="\033[38;2;229;192;123m"     # amber
    else
        color="\033[38;2;224;108;117m"     # red
    fi

    local bar_filled=$(printf '█%.0s' $(seq 1 $filled 2>/dev/null))
    local bar_empty=$(printf '░%.0s' $(seq 1 $empty 2>/dev/null))
    printf "%b" "${color}${bar_filled}${DIM}${bar_empty} ${color}${pct}%${RESET}"
}

RATE_DISPLAY=""
if [ -n "$RATE_5H" ]; then
    R5_BAR=$(build_rate_bar "$RATE_5H")
    RATE_DISPLAY="${DIM}5h${RESET} ${R5_BAR}"
    if [ -n "$RATE_7D" ]; then
        R7_BAR=$(build_rate_bar "$RATE_7D")
        RATE_DISPLAY="${RATE_DISPLAY} ${DIM}7d${RESET} ${R7_BAR}"
    fi
fi

# --- Assemble ---
OUT="🍄 ${LABEL}{{AI_NAME}}${RESET}"

if [ -n "$VAULT_NAME" ]; then
    OUT="${OUT} ${SEP}·${RESET} ${VAULT_COLOR}${VAULT_NAME}${RESET}"
fi

if [ -n "$SESSION_DUR" ]; then
    OUT="${OUT} ${SEP}·${RESET} ${DUR_COLOR}${SESSION_DUR}${RESET}"
fi

if [ -n "$TOKEN_DISPLAY" ]; then
    OUT="${OUT} ${SEP}·${RESET} ${TOK_COLOR}${TOKEN_DISPLAY} tok${RESET}"
fi

if [ -n "$RATE_DISPLAY" ]; then
    OUT="${OUT} ${SEP}·${RESET} ${RATE_DISPLAY}"
fi

OUT="${OUT} ${SEP}·${RESET} ${CTX_DISPLAY}"

printf "%b" "$OUT"
```

---

## Post-Upgrade Notes

Tell the owner:
- Start next session by opening a new conversation and pasting `_Spore-v0.6.1.md` as the first message
- Keep `_Spore-VMD-Toolset.v0.6.1.md` at vault root — the AI consults it on demand
- The User Guide (`Projects/Spore-v0.6.1/User-Guide.md`) is their plain-language reference for commands

When owner is comfortable with the upgrade, this upgrade file self-destructs.
