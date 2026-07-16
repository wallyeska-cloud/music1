---
description: Let an anonymous user (who started the wizard, or a gift recipient) convert to a permanent account, migrating their draft brief and song ownership without data loss. Use when building the account-claim flow.
---

# implement-anonymous-to-permanent-upgrade

**Purpose:** Preserve work created anonymously when a user signs up.

**Use when:** building the "claim your song / create an account" conversion.

## Inputs
- Anonymous user id; target sign-up method.

## Procedure
1. Use Supabase's anonymous→permanent linking (attach email/OAuth identity to the existing user).
2. Ensure the user's personal org and memberships persist across the upgrade.
3. Re-point any `song_briefs`/`songs` ownership as needed so nothing is orphaned.
4. Test: create anonymously → upgrade → confirm songs still owned/visible.

## Output
- A working upgrade flow with no data loss.

## Dependencies
- Skills: `setup-supabase-auth`, `enforce-org-multitenancy`. Library: `@supabase/supabase-js`.

## References
- [Anonymous → permanent](https://supabase.com/docs/guides/auth/auth-anonymous#convert-an-anonymous-user-to-a-permanent-user)

## Guardrails
- Never lose or leak a user's in-progress work during the transition.
