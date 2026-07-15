---
name: refine-task-scope
description: Refine ambiguous or incomplete software work into a clear, implementation-ready scope by inspecting available project context, uncovering blind spots, separating facts from assumptions, resolving high-impact questions, and defining outcomes, boundaries, requirements, edge cases, and acceptance criteria. Use when a user proposes a feature, bug fix, refactor, integration, migration, automation, or other software task whose needs, constraints, affected behavior, or definition of done are not yet sufficiently clear.
---

# Refine Task Scope

Turn a software request into the smallest clear scope that can be implemented and verified confidently. Scale the depth of the process to the size and risk of the task.

## Establish the Evidence

1. Restate the requested outcome in plain language.
2. Inspect available sources of truth before asking the user for information that can be discovered:
   - relevant code, tests, schemas, configuration, and documentation
   - issue, design, error, log, or review context supplied by the user
   - existing conventions and analogous behavior in the project
3. Distinguish explicitly between:
   - **Known:** supported by evidence or stated by the user
   - **Assumed:** a reasonable default that still needs confirmation
   - **Unknown:** information neither discoverable nor safely inferable
4. Do not modify the implementation when the user asked only to clarify or scope the work.

## Build the Scope

Define only the dimensions relevant to the request:

- user or system problem and desired outcome
- actors, permissions, and affected workflows
- current behavior and intended behavior
- inputs, outputs, data ownership, and state transitions
- in-scope behavior and explicit non-goals
- dependencies, integrations, and compatibility constraints
- security, privacy, accessibility, performance, and reliability needs
- migration, rollout, observability, and rollback needs
- acceptance criteria and validation approach

Prefer observable behavior over implementation prescriptions unless the architecture itself is a requirement.

## Probe for Blind Spots

Stress-test the proposed scope with the scenarios that materially apply:

- empty, invalid, duplicate, stale, and boundary inputs
- loading, retry, timeout, offline, and partial-failure states
- authorization failures and sensitive-data exposure
- concurrent actions, idempotency, and interrupted operations
- backward compatibility and existing-data migration
- responsive, keyboard, localization, and accessibility behavior
- monitoring, support, recovery, and rollback after release

Do not turn this checklist into boilerplate. Omit categories that cannot affect the task.

## Resolve Questions Efficiently

Classify each unresolved item:

- **Blocking:** different answers materially change the solution or make implementation unsafe
- **Important:** affects quality or edge behavior but permits a reversible default
- **Deferred:** valid follow-up work outside the current objective

Answer discoverable questions by inspecting the project. For the rest:

1. Ask only the smallest set of blocking questions, normally one to three at a time.
2. Explain the concrete decision or tradeoff behind each question.
3. Recommend a default when one is safe and state its consequence.
4. Record accepted defaults as assumptions rather than repeatedly asking for confirmation.
5. Avoid exhaustive questioning when a small, reversible task can proceed safely.

## Challenge the Request Constructively

Point out contradictions, unnecessary complexity, hidden dependencies, and scope that does not serve the stated outcome. Recommend a narrower or staged version when it reduces risk or time while preserving the core value. Keep optional improvements separate from required work.

## Produce the Refined Scope

When the scope has converged, present a concise artifact using the relevant sections below:

```markdown
# Task

## Outcome

## Current Behavior

## In Scope

## Out of Scope

## Requirements

## Acceptance Criteria

## Edge Cases and Failure States

## Constraints and Dependencies

## Assumptions

## Open Questions

## Validation and Rollout
```

Write acceptance criteria as observable pass/fail statements. Keep unresolved blocking questions visible; do not disguise guesses as requirements. For a small task, collapse the artifact to outcome, scope, acceptance criteria, and assumptions.

## Completion Gate

Consider the task ready for implementation when:

- the desired outcome and boundaries are unambiguous
- affected users, systems, and data are identified
- blocking questions are resolved or explicitly assigned to a decision owner
- important failure and edge behavior has a defined default
- acceptance criteria can be tested
- assumptions, dependencies, and non-goals are visible

If the user also requested implementation, proceed once this gate is satisfied. Otherwise, stop after delivering the refined scope and remaining decisions.
