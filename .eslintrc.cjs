module.exports = {
  extends: ['@payloadcms'],
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['*.js', '*.cjs', '*.json', '*.md', '*.yml', '*.yaml'],
    },
    {
      files: ['packages/eslint-config-payload/**'],
      rules: {
        'perfectionist/sort-objects': 'off',
      },
    },
  ],
  root: true,
}
