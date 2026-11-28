import type { PackageManager } from './types.js'

import { resolveSelfCommand } from './selfCommand.js'

/** Render a target-specific update or migration prompt for the detected project. */
export function renderUpgradePrompt({
  command = resolveSelfCommand(),
  currentVersion,
  hasNext = true,
  kind = 'migrate',
  packageManager,
  targetVersion,
  yes = false,
}: {
  command?: string
  currentVersion?: string
  hasNext?: boolean
  kind?: 'migrate' | 'update'
  packageManager?: PackageManager
  targetVersion?: string
  yes?: boolean
} = {}): string {
  const targetFlags = `${targetVersion ? ` --tag ${targetVersion}` : ''}${yes ? ' --yes' : ''}${packageManager ? ` --package-manager ${packageManager}` : ''}`
  if (kind === 'update') {
    return `Update this project from Payload ${currentVersion} to ${targetVersion}, staying within the same Payload major.

Run \`${command} upgrade run${targetFlags}\` from the project root. Review its package preview and resolve any compatibility blockers before continuing. Core publish-list packages use the selected Payload version; independently versioned plugins use their own compatible releases. Preserve unrelated dependencies and intentional overrides.

Do not run the v3 -> v4 transforms, raise v4 toolchain floors, or run a Next.js major migration for this update. After installation, regenerate Payload types and the import map where applicable, then run the project's typecheck, tests, and build. Report any failures or unverified steps.
`
  }
  const prompt = `You are upgrading this project from Payload ${currentVersion ?? 'v3'} to ${targetVersion ?? 'v4'}, Next.js 16 included.

Ground rule: resolution over intent. A step is done only when it installs, builds, and boots.
Never report a task complete because the edit looks right. Confirm it. A silent gap reads as
"checked and fine".

## 0. Preconditions
- Work on a clean git tree or a fresh branch.
- Use Node ^24.22.3 || >=26.13.1 (the exact engines floor is printed by the command in step 2).

## 1. Pre-upgrade migrations (do these on v3, before touching versions)
Some migrations need the v3 tooling that v4 deletes, so they MUST run before the upgrade:
- Slate richtext is removed in v4. Migrate Slate -> Lexical while still on v3; the migration path
  is gone once the packages are pinned to v4.

Do not proceed to step 2 until these are complete and committed.

## 2. Payload mechanical slice
Run this from the project root:

    ${command} upgrade run${targetFlags}

The selected target is ${targetVersion ?? 'chosen interactively by the command'}.
This pins core publish-list packages to the chosen version and independently versioned plugins
to their compatible releases, removes conflicting core overrides, writes the toolchain
floors, installs, and runs the AST transforms. Read its report:
- It prints the resolved payload version, the required Next target, and the path to the
  bundled runbook and migration guide. Use those paths below.
- The unmet \`@payloadcms/next\` peer against Next 15 is EXPECTED at this point. Do NOT downgrade
  payload to satisfy it; step 3 resolves it by upgrading Next.
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
\`importMap.js\`; regenerate them.

## 5. Fix-forward judgment work (against the now-v4 tree)
These depend on the v4 APIs and types existing, so they follow the upgrade. Open the bundled
migration guide (\`v4.mdx\`, path printed in step 2) and the bundled runbook
(\`runbook/payload-v4-upgrade.md\`) and work the items they list: SCSS -> CSS and \`--theme-*\` ->
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
  if (hasNext) {
    return prompt
  }
  return prompt
    .replace(', Next.js 16 included.', '.')
    .replace(/- The unmet `@payloadcms\/next` peer[\s\S]*?- Do not hand-edit/, '- Do not hand-edit')
    .replace(/## 3\. Next.js 16[\s\S]*?## 4\./, '## 4.')
}
