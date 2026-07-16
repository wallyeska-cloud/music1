---
description: Keep .claude/CLAUDE.md §3 "Current State" and the File Structure Map accurate as work lands, and prune stale entries. Use after a feature merges or an open decision is resolved.
---

# update-project-memory

**Purpose:** Prevent the memory file from going stale so future sessions onboard correctly.

**Use when:** a feature merges, an open decision is resolved, or CLAUDE.md looks out of date.

## Inputs
- Recent changes/PRs; resolved open decisions.

## Procedure
1. Update CLAUDE.md §3 "Current State": done / in-progress / blocked.
2. Update the File Structure Map once code exists.
3. Close resolved "Open decisions"; remove stale notes.
4. Keep it concise — facts/conventions/rationale only; link to `research/` docs rather than pasting content.

## Output
- An accurate, lean CLAUDE.md.

## Dependencies
- None.

## References
- [Claude Code memory](https://code.claude.com/docs/en/memory)

## Guardrails
- Don't paste code dumps or full directory trees into CLAUDE.md. Don't record status you can't verify.
