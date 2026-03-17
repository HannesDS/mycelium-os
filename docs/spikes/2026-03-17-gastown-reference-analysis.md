# Spike: Gas Town Reference Analysis

**Date:** 2026-03-17
**Bead:** mo-3ci
**Timebox:** 1 hour

---

## 1. Scope

Analyse the Gas Town CLI (`gt` v0.12.0, `bd` v0.60.0) as a reference for Mycelium OS design.
Focus: Mayor pattern, Convoy work-tracking, Formula workflows.

Two questions to answer:
1. Should Mycelium add a constitution-level workflow/formula layer before MYC-44?
2. Document the beads name collision and propose resolution.

---

## 2. Gas Town Concepts

### 2.1 Mayor Pattern

The Mayor is a persistent agent (the "Chief of Staff") that acts as global coordinator
across all rigs (projects) in a Gas Town workspace. It:

- Receives escalations from rig-level Witnesses
- Routes work across rigs via convoy dispatch
- Is the bridge between the human Overseer and the autonomous system
- Is long-lived and stateful (runs in a tmux session)

**Relevance to Mycelium:** The Mayor maps to the `ceo-shroom` concept — the top-level
shroom that receives escalations and routes decisions. However, the Mayor is
*infrastructure* (outside any rig's domain), while `ceo-shroom` is *domain* (inside the
constitution). Mycelium's escalation protocol already captures this distinction in
`mycelium.yaml` via `escalates_to` and graph `edges`.

### 2.2 Convoy Work-Tracking

A convoy is a persistent tracking unit that monitors a set of related issues across rigs.

- **Convoy** = "this batch of work, across projects, with progress tracking"
- **Swarm** = ephemeral — the workers currently assigned to convoy issues
- Convoys auto-close when all tracked issues complete and notify subscribers
- Used for: "dispatch 6 polecats to review a PRD in parallel, then continue when all done"

**Relevance to Mycelium:** Mycelium's multi-shroom workflow use case (e.g. the constitution
onboarding flow in MYC-44) needs a similar fan-out/fan-in pattern: dispatch multiple
shrooms to do parallel sub-tasks, then gate on a human decision, then continue.

The workflow engine (MYC-49) is planned to implement this. Convoys are the Gas Town
equivalent of what MYC-49 will build at the Mycelium layer.

### 2.3 Formula Workflows

Formulas are TOML-defined DAGs of steps (molecules). Each step has:
- A `description` with entry/exit criteria and shell commands
- `needs` (dependency on prior steps)
- Variables injected from config, hook, or sling vars

The formula system is primarily **agent lifecycle management** infrastructure:
- `mol-polecat-work` = how a code worker works through an issue
- `mol-witness-patrol` = how the monitor cycles through checking workers
- `mol-convoy-feed` = how the dispatcher assigns work

It also covers **domain workflows** with human gates:
- `mol-idea-to-plan` = vague idea → approved beads plan (with human clarify + approve steps)
- `shiny` = design → implement → review → test → submit

The key insight: Gas Town stores formulas as separate TOML files, not inside any rig's
config. They are shared infrastructure the Mayor can pour into any rig.

---

## 3. Q1 — Should Mycelium add a constitution-level workflow layer before MYC-44?

### What's planned

| Bead | Description | Status |
|------|-------------|--------|
| MYC-49 (mo-5p2) | Workflow engine — step runner, branching, human gates | Open |
| MYC-47 (mo-jn9) | Escalation chain runtime + delegation | Open |
| MYC-44 (mo-3tq) | Constitution onboarding flow — uses the workflow engine | Blocked on MYC-49 |

The workflow engine (MYC-49) is the *runner*. It will execute steps. This is correct
sequencing. **However, the constitution schema is missing the workflow declarations.**

### The gap

Currently `mycelium.yaml` defines:
- `company` metadata
- `shrooms` (capabilities, permissions, escalation)
- `graph.edges` (topology)

What's absent is a way to declare **named business workflows** in the constitution —
e.g. the onboarding flow that MYC-44 will implement. Without a `workflows:` section,
the runner (MYC-49) would have no declarative input to run.

### Recommendation: Yes, but keep it minimal

**Add a `workflows:` section to the constitution schema before or alongside MYC-44.**

This is a small chore, not a feature sprint. The deliverable:
1. A `workflows:` key in `mycelium.yaml` with a basic YAML schema
2. A Pydantic model `WorkflowDefinition` added to the manifest schema (MYC-21 work)
3. A single example workflow in the constitution (the onboarding flow)

A minimal `workflows:` schema:

```yaml
workflows:
  - id: onboarding
    name: "Company Onboarding"
    trigger: manual          # manual | event | cron
    steps:
      - id: intake
        shroom: ceo-shroom
        action: gather_context
      - id: draft
        shroom: ceo-shroom
        action: draft_constitution
        needs: [intake]
      - id: human-approve
        type: human_gate
        prompt: "Review and approve the draft constitution."
        needs: [draft]
      - id: commit
        shroom: ceo-shroom
        action: commit_constitution
        needs: [human-approve]
```

**Why before MYC-44?** Because MYC-44 (constitution onboarding) IS a workflow. The
schema should exist so MYC-44 can be implemented against it, rather than hardcoding
the workflow steps in the runner. This keeps the constitution as source of truth.

**Effort:** Small (half-day chore, add to MYC-49 or file separately as MYC-50).

**Alternative — defer:** Hardcode the onboarding flow in MYC-44's implementation, add
the schema later when there are 2+ workflows. This is simpler short-term but leads to
the same refactor within 2 sprints. Not recommended.

---

## 4. Q2 — Beads Name Collision

### The collision

Two systems use "beads" with different meanings:

| System | "Beads" means | Location | Access |
|--------|--------------|----------|--------|
| **Gas Town** | Dolt-backed issue tracker entries | `~/.beads/`, `bd` CLI | `bd show`, `bd create`, etc. |
| **Mycelium OS** | Shroom episodic memory records | `core/memory/beads.py`, `ShroomBead` model | Postgres via SQLAlchemy |

The Gas Town meaning is externally visible (CLI commands, prompts, docs, agent instructions).
The Mycelium meaning is internal (Python model name, ADR-004 terminology, UI label in MYC-23).

### Risk

In the current Gas Town setup, Mycelium polecats work under Gas Town and see `bd` (beads)
constantly in their system prompts and tools. Any future AI working on the Mycelium control
plane codebase will encounter `ShroomBead`, `beads.py`, and "beads memory" in the same
context where `bd` means "issue tracking". This creates a real disambiguation burden:

- "Run `bd list` to see all beads" (Gas Town: list issues)
- "Call `append_bead()` to store a memory" (Mycelium: episodic memory)
- ADR-004 says "three-layer memory: working / **beads** / RAG"

### Resolution: Rename Mycelium's episodic memory tier

Recommended rename: **"episodes"** (episodic memory → episodes)

| Current | Proposed |
|---------|---------|
| `core/memory/beads.py` | `core/memory/episodes.py` |
| `ShroomBead` model | `ShroomEpisode` model |
| `append_bead()` | `append_episode()` |
| `get_recent_beads()` | `get_recent_episodes()` |
| ADR-004: "working / beads / RAG" | "working / episodes / RAG" |
| UI label "Memory (beads)" | "Memory (episodes)" |

**Why "episodes"?** Episodic memory is the correct cognitive science term for what this
layer implements — event-based recall tied to a specific shroom's experience. "Episodes"
is unambiguous, domain-appropriate, and has no collision with any Gas Town concept.

**Alternatives considered:**
- "pulses" — evocative but not self-documenting
- "traces" — already used by MYC-27 (Traces viewer for the audit log)
- "records" — generic, no domain character
- "threads" — overloaded in concurrent programming contexts

**Scope of rename:**
- `apps/control-plane/core/memory/beads.py` (single file, ~110 lines)
- `apps/control-plane/core/models.py` (ShroomBead model)
- Alembic migration to rename the DB table `shroom_beads` → `shroom_episodes`
- ADR-004 update
- Any MYC-23 UI labels if implemented

This is low-risk (entirely internal, no API surface yet) and should be done before
MYC-23 (Memory view) ships to avoid the rename showing up in the UI.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Add constitution-level workflow layer before MYC-44? | **Yes** — add a minimal `workflows:` section to the constitution schema (half-day chore) before or alongside MYC-49. Keeps constitution as source of truth. |
| Beads name collision? | **Real collision.** Gas Town `bd` beads = issue tracker. Mycelium beads = episodic shroom memory. Rename Mycelium's layer to "episodes" in code, models, ADR, and UI. File as a chore bead before MYC-23 ships. |

---

## 6. Suggested follow-on beads

1. **Chore: Add `workflows:` schema to constitution and Pydantic manifest** — file before MYC-49 starts, small
2. **Chore: Rename Mycelium episodic memory tier from "beads" to "episodes"** — file before MYC-23 ships, small
