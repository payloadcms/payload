/**
 * Render the overarching agent prompt for a full Payload v3 -> v4 upgrade,
 * Next.js 16 included. The prompt is a thin orchestrator: it sequences the
 * gates, runs this package's `upgrade` command for the deterministic slice,
 * delegates Next.js to Next's own agent workflow, and points at the migration
 * guide for the judgment work rather than restating any of it. The text is
 * static and project-agnostic — the agent runs it from the project root. Pure:
 * the caller prints it.
 */
export function renderUpgradePrompt(): string {
  return `You are upgrading this project from Payload v3 to v4, Next.js 16 included.

Ground rule: resolution over intent. A step is done only when it installs, builds, and boots.
Never report a task complete because the edit looks right — confirm it. A silent gap reads as
"checked and fine".

## 0. Preconditions
- Work on a clean git tree or a fresh branch.
- Use Node >=24.15 (the exact engines floor is printed by the command in step 2).

## 1. Pre-upgrade migrations (do these on v3, before touching versions)
Some migrations need the v3 tooling that v4 deletes, so they MUST run before the upgrade:
- Slate richtext is removed in v4. Migrate Slate -> Lexical while still on v3; the migration path
  is gone once the packages are pinned to v4.

Do not proceed to step 2 until these are complete and committed.

## 2. Payload mechanical slice
Run this from the project root:

    npx @payloadcms/codemod upgrade .

Add \`--tag <dist-tag>\` to resolve Payload from a non-default dist-tag (default is \`canary\`).
This pins the Payload packages to v4, removes conflicting overrides, writes the toolchain
floors, installs, and runs the AST transforms. Read its report:
- It prints the resolved payload version, the required Next target, and the path to the
  bundled runbook and migration guide. Use those paths below.
- The unmet \`@payloadcms/next\` peer against Next 15 is EXPECTED at this point. Do NOT downgrade
  payload to satisfy it — step 3 resolves it by upgrading Next.
- Do not hand-edit the versions it pinned.

## 3. Next.js 16 (delegate to Next's workflow)
Payload v4 requires Next 16. The command above did not touch Next. Run Next's own recommended
agent workflow, which bumps Next + React and migrates the code as one unit:
<https://nextjs.org/docs/app/guides/upgrading/version-16#use-an-ai-agent-recommended>

In short: run \`npx @next/codemod@canary upgrade latest\`, then
\`npx @next/codemod@canary next-async-request-api .\`, and follow Next's AGENTS.md workflow for
the rest. Keep the result within the Next target range printed in step 2's report. Reinstall
afterward so the \`@payloadcms/next\` peer resolves.

## 4. Regenerate generated files
\`payload generate:types && payload generate:importmap\`. Never hand-edit \`payload-types.ts\` or
\`importMap.js\` — regenerate them.

## 5. Fix-forward judgment work (against the now-v4 tree)
These depend on the v4 APIs and types existing, so they follow the upgrade. Open the bundled
migration guide (\`v4.mdx\`, path printed in step 2) and the bundled runbook
(\`runbook/payload-v4-upgrade.md\`) and work the items they list — SCSS -> CSS and \`--theme-*\` ->
\`--color-*\` token renames, Lexical union type-narrowing, jobs DB migrations, strict cron parsing,
and anything flagged in the per-transform notes. Consult the guide for each; do not guess from
memory.

## 6. Verify
- \`tsc --noEmit\` (delete \`tsconfig.tsbuildinfo\` first; set \`checkJs: true\` so \`importMap.js\` is covered).
- Run integration and e2e tests separately.
- Build.
- Confirm native modules (e.g. \`sharp\`) still load.

## 7. Report
Distinguish verified, cannot-confirm, and broken. Do not call the upgrade complete while any
gate fails or any generated file is stale.
`
}
