# Payload v3 -> v4: remaining steps

`npx @payloadcms/codemod upgrade run` has done the mechanical slice: pinned Payload packages to v4,
removed conflicting overrides, written the toolchain floors, installed, and run the AST
transforms. This checklist is what it did NOT do. The authoritative breaking-change list is
the migration guide (`docs/migration-guide/v4.mdx`, also bundled at `dist/runbook/v4.mdx`):
<https://github.com/payloadcms/payload/blob/main/docs/migration-guide/v4.mdx>

Report each item as verified / cannot-confirm / broken. Do not call the upgrade complete while
any gate fails or any generated file is stale.

## 0. Before upgrading (do on v3)

Some migrations need v3 tooling that v4 removes, so they must run BEFORE `upgrade run`,
while the v3 packages are still installed:

- Slate richtext is deleted in v4. Migrate Slate -> Lexical on v3; the migration path is gone once
  packages are pinned to v4.

## 1. Next.js 16

Payload v4 requires Next 16. The command did not touch Next. Run Next's own recommended agent
workflow, which bumps Next + React and migrates the code as one unit:
<https://nextjs.org/docs/app/guides/upgrading/version-16#use-an-ai-agent-recommended>

Keep the resulting Next version within `>=16.2.6 <17` (the exact target is printed in the
upgrade report), since Next's `upgrade latest` may point past 16 in future.

## 2. Regenerate generated files

```bash
payload generate:types && payload generate:importmap
```

Never hand-edit `payload-types.ts` or `importMap.js` — regenerate them. If a credential wall
blocks generation, set dummy env values and re-run.

## 3. Manual v4 items (not covered by transforms)

- SCSS is gone: move `@payloadcms/ui/scss` to `@payloadcms/ui/css`; rename `--theme-*` -> `--color-*`.
- Sweep agent/editor instruction files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`) for APIs v4 removed.
- Cron parsing is strict now: `/10 * * * *` -> `*/10 * * * *`.
- Jobs: run DB migrations for the new lease/stats fields.
- Review per-transform notes printed in the upgrade report for spots needing manual review.

## 4. Verify

- `tsc --noEmit` (delete `tsconfig.tsbuildinfo` first; set `checkJs: true` so `importMap.js` is covered).
- Run integration tests and e2e separately.
- Build.
- Confirm native modules (e.g. `sharp`) still load.

## 5. Report honestly

Distinguish verified, cannot-confirm, and broken. A silent gap reads as "checked and fine".
