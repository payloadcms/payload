// oxlint and oxfmt exit non-zero when every file they're given is excluded by their ignore
// patterns (e.g. a commit that only touches `tsconfig.json` or a template file).
// oxlint ignores `templates/**`: templates are linted standalone with their own ESLint config.
const oxlint = 'oxlint --fix --no-error-on-unmatched-pattern'
const oxfmt = 'oxfmt --no-error-on-unmatched-pattern'

export default {
  // Every file type `pnpm format:check` checks in CI, except JS/TS (oxlint + oxfmt below).
  // oxfmt also sorts package.json keys (`sortPackageJson` in oxfmt.config.ts).
  '*.{cjs,css,cts,graphql,html,json,jsonc,md,mdx,mjs,mts,scss,toml,yaml,yml}': oxfmt,
  '.swcrc': oxfmt,
  '*.{js,jsx,ts,tsx}': [oxlint, oxfmt],
  'templates/**/pnpm-lock.yaml': 'pnpm runts scripts/remove-template-lock-files.ts',
  'tsconfig.base.json': 'node scripts/reset-tsconfig.js',
  'README.md': "sh -c 'cp ./README.md ./packages/payload/README.md'",
}
