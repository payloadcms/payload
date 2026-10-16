// lint-staged config lives here (not in package.json) so the JS/TS rule can be a
// function: ESLint's `v10_config_lookup_from_file` flag loads each file's nearest
// eslint config, and the `templates/*` configs require deps that aren't installed in
// the monorepo. We filter template files out of ESLint (oxfmt still formats them);
// templates are linted standalone via their own `lint` script / build.
const isTemplateFile = (file) => file.includes('/templates/')
const quote = (files) => files.map((file) => `'${file}'`).join(' ')
// Unlike prettier, oxfmt exits non-zero when every file it's given is excluded by
// `ignorePatterns` (e.g. a commit that only touches `tsconfig.json`).
const oxfmt = 'oxfmt --no-error-on-unmatched-pattern'

export default {
  // oxfmt also sorts package.json keys (`sortPackageJson` in oxfmt.config.ts)
  '*.{md,mdx,yml,json}': oxfmt,
  '*.{js,jsx,ts,tsx}': (files) => {
    const commands = []
    const lintable = files.filter((file) => !isTemplateFile(file))

    if (lintable.length) {
      commands.push(`eslint --flag v10_config_lookup_from_file --cache --fix ${quote(lintable)}`)
    }

    commands.push(`${oxfmt} ${quote(files)}`)

    return commands
  },
  'templates/**/pnpm-lock.yaml': 'pnpm runts scripts/remove-template-lock-files.ts',
  'tsconfig.base.json': 'node scripts/reset-tsconfig.js',
  'README.md': "sh -c 'cp ./README.md ./packages/payload/README.md'",
}
