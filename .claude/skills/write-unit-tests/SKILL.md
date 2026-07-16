---
description: Write Vitest unit tests for data-access helpers, entitlement logic, the generateSong wrapper (mocked), and utilities. Use after writing a logic-bearing module.
---

# write-unit-tests

**Purpose:** Cover logic branches so regressions surface early.

**Use when:** a module with real logic is added or changed.

## Inputs
- Target module; cases + edge cases.

## Procedure
1. Add `*.test.ts` beside the module.
2. Cover happy path + edge cases (esp. entitlement decrement, status transitions, error shapes).
3. Mock external vendors — no live calls.
4. Keep tests deterministic and fast.

## Output
- Meaningful unit tests.

## Dependencies
- Libraries: `vitest`, `@testing-library/react`.

## References
- [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/docs/)

## Guardrails
- Test behavior, not implementation trivia. Never weaken a test just to make it pass.
