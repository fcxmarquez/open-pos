---
name: tdd-feature-workflow
description: "Use from the main Claude Code session whenever implementing a new feature, capability, user-visible behavior, API behavior, integration, regression fix, or hotfix in this repository, even if the user does not mention tests or TDD. Orchestrates resumable test-engineer and feature-engineer workers through mechanical RED, GREEN, and full-quality gates. Do not invoke this skill inside a subagent."
hooks:
  SubagentStart:
    - matcher: "test-engineer|feature-engineer"
      hooks:
        - type: command
          command: bun
          args:
            - "${CLAUDE_PROJECT_DIR}/.claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts"
            - hook-subagent-start
          timeout: 10
  PreToolUse:
    - matcher: "Edit|Write|Bash"
      hooks:
        - type: command
          command: bun
          args:
            - "${CLAUDE_PROJECT_DIR}/.claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts"
            - hook-pre-tool
          timeout: 10
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: bun
          args:
            - "${CLAUDE_PROJECT_DIR}/.claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts"
            - hook-post-tool
          timeout: 10
  SubagentStop:
    - matcher: "test-engineer|feature-engineer"
      hooks:
        - type: command
          command: bun
          args:
            - "${CLAUDE_PROJECT_DIR}/.claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts"
            - hook-subagent-stop
          timeout: 10
  Stop:
    - hooks:
        - type: command
          command: bun
          args:
            - "${CLAUDE_PROJECT_DIR}/.claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts"
            - hook-stop
          timeout: 10
---

# TDD feature workflow

Run this workflow only in the main Claude Code session. Do not preload this skill into either worker. Claude subagents do not inherit skills invoked by the main session, so the orchestration stays in the parent while each worker receives only its own agent definition and delegation prompt.

Use the workflow for new behavior and behavior-changing fixes, including hotfixes that correct a regression. Do not use it for read-only investigation, explanations, documentation-only edits, formatting-only changes, or refactors that intentionally preserve behavior.

## Main-session responsibilities

The main session is the hub. It owns phase transitions, worker invocation, agent-ID continuity, specialist routing, quality verification, and the final report. Workers do not ping-pong directly.

The gate persists the first `test-engineer` and `feature-engineer` IDs in `.claude/tdd-state.json`. Claude Code preserves each custom subagent's transcript within the parent session. When a phase must be revisited, use `SendMessage` with the recorded ID to resume that worker's existing context. Do not spawn a replacement agent merely because a later gate fails.

## Phase 0: establish or resume state

First inspect the state:

`bun .claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts status`

- If an incomplete workflow exists for this request, resume it from its recorded phase and agent IDs.
- If no workflow exists, start one before any production edit:

  `bun .claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts start --task "concise feature summary"`

- If an incomplete workflow belongs to a different request, do not overwrite it. Ask whether to resume or explicitly abort it.

The start command snapshots all pre-existing dirty files by content hash. The RED gate therefore distinguishes this feature's edits from unrelated user changes already in the worktree.

## Phase 1: tests and RED

Invoke exactly one `test-engineer` custom subagent with:

- the requested outcome and acceptance criteria
- relevant scope discovered by the main session
- explicit instruction to own tests only and run the mechanical RED command

The `SubagentStart` hook records its ID. The test-engineer cannot edit production files, and its `SubagentStop` hook refuses completion until RED is verified.

After it returns, run `status` and confirm:

- phase is `red_verified`
- `agents.test-engineer` is present
- the expected marker identifies a behavioral failure
- no production file changed after the baseline

Do not proceed on a syntax, import, fixture, test-discovery, environment, or unrelated failure.

## Phase 2: implementation and GREEN

Invoke exactly one `feature-engineer` custom subagent with:

- the original outcome and acceptance criteria
- the RED test paths, command, expected failure, and evidence from state
- explicit instruction to own production code only and run the mechanical GREEN command

The feature-engineer cannot edit test files. The GREEN gate hashes the RED tests and refuses success if they changed. Its `SubagentStop` hook refuses completion until the unchanged RED tests pass.

After it returns, run `status` and confirm phase is `green_verified` and `agents.feature-engineer` is present.

## Phase 3: hard quality gate

The main session runs:

`bun .claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts verify`

This deterministic command runs, in order:

1. `bun run format`
2. the focused GREEN command again after formatting
3. `bun run lint`
4. `bun run typecheck`
5. `bun test`
6. `bun run build`

The Stop hook prevents the main session from declaring completion while the state is incomplete.

## Failure routing and context preservation

- A test design, fixture, coverage, or missing-acceptance-criterion problem belongs to the recorded test-engineer. Resume it with `SendMessage`; any test edit invalidates prior RED and requires a new RED proof.
- A production behavior, type, lint, build, or focused GREEN problem belongs to the recorded feature-engineer. Resume it with `SendMessage` and re-run GREEN.
- A database or dependency need belongs to the applicable specialized project agent, coordinated by the main session without replacing the two TDD owners.
- An ambiguous requirement or unavailable prerequisite is reported by a worker with `TDD_BLOCKED:`. The SubagentStop hook stores the blocker and lets the main session yield to the user without discarding state or worker IDs.

Use the agent IDs printed by `status`. Resuming preserves the worker's prior transcript, tool calls, and reasoning context; creating a new worker does not.

After the blocker is resolved, clear the blocker with:

`bun .claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts resume`

Then use `SendMessage` to resume the recorded worker with the new decision or prerequisite.

## Cancellation

Abort only when the user cancels the feature or the scope is intentionally abandoned:

`bun .claude/skills/tdd-feature-workflow/scripts/tdd-gate.ts abort --reason "explicit reason"`

Do not use abort to bypass a failing gate.

## Final handoff

Report:

- RED test paths, command, expected failure, and why it was valid
- production implementation that produced GREEN
- whether either worker was resumed and why
- results of format, focused GREEN, lint, typecheck, full tests, and build
- any manual verification or residual risk
