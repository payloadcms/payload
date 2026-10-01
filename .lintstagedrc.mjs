// lint-staged config lives here (not in package.json) so the JS/TS rule can be a
// function: ESLint's `v10_config_lookup_from_file` flag loads each file's nearest
// eslint config, and the `templates/*` configs require deps that aren't installed in
// the monorepo. We filter template files out of ESLint (prettier still formats them);
// templates are linted standalone via their own `lint` script / build.
const isTemplateFile = (file) => file.includes('/templates/')
const quote = (files) => files.map((file) => `'${file}'`).join(' ')

export default {
  '**/package.json': 'sort-package-json',
  '*.{md,mdx,yml,json}': 'prettier --write',
  '*.{js,jsx,ts,tsx}': (files) => {
    const commands = []
    const lintable = files.filter((file) => !isTemplateFile(file))

    if (lintable.length) {
      commands.push(
        `eslint --flag v10_config_lookup_from_file --cache --fix ${quote(lintable)}`,
      )
    }

    commands.push(`prettier --write ${quote(files)}`)

    return commands
  },
  'templates/**/pnpm-lock.yaml': 'pnpm runts scripts/remove-template-lock-files.ts',
  'tsconfig.base.json': 'node scripts/reset-tsconfig.js',
  'README.md': "sh -c 'cp ./README.md ./packages/payload/README.md'",
}
