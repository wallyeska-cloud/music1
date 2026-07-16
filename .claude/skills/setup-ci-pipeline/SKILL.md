---
description: Set up the GitHub Actions CI pipeline — typecheck, lint, unit + E2E tests, and apply Supabase migrations on deploy, blocking merge on failure. Use when establishing or changing CI.
---

# setup-ci-pipeline

**Purpose:** Gate every change on green checks and keep the schema in sync.

**Use when:** setting up or changing CI/CD.

## Inputs
- Test/lint commands; env/secrets; branch protection rules.

## Procedure
1. Add `.github/workflows/*.yml`: `tsc` typecheck, ESLint, Vitest, Playwright.
2. Apply Supabase migrations on deploy.
3. Make these required status checks; block merge on failure.
4. Store secrets in GitHub Actions secrets (never in the repo).

## Output
- CI workflows + required checks.

## Dependencies
- GitHub Actions. Skills: `write-unit-tests`, `write-e2e-tests`, `apply-migration-and-generate-types`.

## References
- [GitHub Actions](https://docs.github.com/en/actions) · [Supabase environments](https://supabase.com/docs/guides/deployment/managing-environments)

## Guardrails
- Never commit secrets. Failing tests (esp. RLS/webhook) must block merge.
