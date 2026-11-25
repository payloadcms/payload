# AGENTS.md

> [!WARNING]
> Never accept a major tradeoff just to follow a rule in this file blindly. If you think there is a good reason to break one, say so and ask the user what to do.

Only add a rule here for a mistake agents repeat, can't learn from the code, and no linter or CI check catches at error level.

## Commands

- `pnpm run dev <dir>` runs the dev server with `test/<dir>/config.ts` (default `_community`, MongoDB from `pnpm docker:start`, `PAYLOAD_DATABASE=postgres` or `sqlite` to switch). It auto-logs in as `dev@payloadcms.com` / `test`.
- `pnpm payload <dir> <command>` runs the Payload CLI against `test/<dir>/config.ts`.
- `pnpm run test:e2e <dir>` runs one suite. `pnpm run test:int <dir>` filters by path, so `fields` also runs `fields-relationship`.
- After changing a test config, run `pnpm run dev:generate-types <dir>` and include the regenerated types in the same PR.

## Code

- Use object parameters, `fn({ name }: { name: string })`, not positional arguments, for backwards compatibility.
- Avoid `as any` and `as unknown as X`, including in tests. Fix the types, or comment why the cast is needed.
- Search for an existing utility or type before writing a new one.
- Use separate `import type` statements for types, even from the same module.
- Render config labels with `getTranslation` from `@payloadcms/translations`. Don't branch on label types yourself.
- Never hardcode user-facing strings. Add keys in English first: `packages/translations/src/languages/` for core, the plugin's `src/translations/`, or the feature's `i18n.ts` in `richtext-lexical`. Use the `generate-translations` skill to translate core and plugin keys.
- Build admin and API URLs with `formatAdminURL` from `payload/shared`, and query strings with `qs-esm`. Never concatenate them by hand.
- In server functions, views, and endpoints, keep `overrideAccess: false` (the default) and pass `user`. `overrideAccess: true` on behalf of a user bypasses access control.
- Use explicit named re-exports, never `export *`, which breaks client/server boundaries in production.
- Server components import client components from `exports/client/index.js` (disabling `payload/no-imports-from-exports-dir` inline), never by relative path, which ignores `'use client'` in production. `pnpm dev` doesn't catch this, so verify with `pnpm prepare-run-test-against-prod` and then `pnpm dev:prod <dir>`.
- For UI changes (rendering, interaction, focus, keyboard, content, semantics), use the `payload-accessibility` skill.
- When behavior changes, update affected examples in `docs/`.

## CSS

- Write new styles in plain CSS, not SCSS.
- Stylelint only checks `packages/ui/src/` and `templates/`. Elsewhere, follow its rules by hand: `min-width` media queries only, breakpoints 400/768/1024/1440px only, no `!important`, no `:has()` above a universal subject, and no sub-pixel values.
- Use logical properties (`margin-inline-start`, `inset-inline`, etc.) instead of physical ones, for RTL.
- Use the tokens in `packages/ui/src/css/` (`--spacer-*`, semantic `--color-*`, `--radius-*`, `--stroke-width-*`, `--elevation-*`, `--text-*`) instead of raw values. Round to the nearest spacer or use `calc()` with one. Never use `--ramp-*` outside `colors.css`.
- Shared CSS also runs in Shadow DOM. Define token defaults on both `:root` and `:host` (also inside media queries), add `:host(...)` equivalents for theme and enhanced-contrast selectors without raising document specificity, and keep document-only resets and Admin Panel layout out of `:host`.

## Tests

- Prefer integration or e2e tests. Ask before adding unit tests for internal functions or small utilities.
- A regression test must fail when the fix is reverted. Revert the fix, run the test, and confirm it fails, then restore the fix and confirm it passes.
- Add tests to an existing suite and config when one fits, instead of creating a new one.
- Integration tests import `test` from `test/__helpers/int/vitest.ts` inside one root `test.suite(name, { config: './config.ts' }, ...)`. The fixture initializes, resets, and seeds Payload, so don't do it yourself. Use `test.options(name, { db: 'drizzle' }, fn)` for database-specific tests.
- Existing suites with `resetBetweenTests: false` seed once and manage their own cleanup between tests. New suites use the default per-test reset.
- Only generate visual regression baselines with `pnpm test:visual:update`, which uses the pinned Docker image. Host-generated baselines fail on CI.
- Dev and e2e run with Next.js `cacheComponents` (disable with `PAYLOAD_DISABLE_CACHE_COMPONENTS=true`). Tag tests whose behavior differs between modes with `@also-without-cache-components`.

## Commits and PRs

- PR titles are `<type>(<scope>): <lowercase title>`, with a type and an optional scope from `.github/workflows/pr-title.yml`. The scope is usually the package name. PRs are squashed with the title as message, so the first commit uses the same format and later ones use `chore`.
- Don't introduce breaking changes unless they fall under an exception in `docs/migration-guide/versioning.mdx`. The v4 migration guide is not permission to add new ones. If a change can't avoid breaking, flag it.
- Breaking PRs get `!` in the title and a `## Breaking Changes` section saying who is affected and what to do, with a `diff` block when user code changes. The release notes copy that section alone.
- Only push or open PRs when asked, and open them as drafts unless told otherwise.
- For PRs that build on each other, use GitHub's native stacked pull requests via the `gh stack` extension (`gh extension install github/gh-stack`, then `gh stack init`, `add`, `submit`, or `gh stack link` for existing branches), not independent PRs that link to each other.
- Fixes need two PRs, one against `main` (v4) and one against `3.x` (v3), each linking the other. Features go to `main` only. If a fix should land on one branch only, say why in the PR description and in the chat.
- Keep descriptions short and informal, backports included, since the PR body becomes the squashed commit body.
- Record interactive or behavioral changes, including fixed bugs, with the `record-pr-demo` skill, with before and after when there is a before. Use screenshots for purely static visual changes.
- Add a short "Written with AI" line.
