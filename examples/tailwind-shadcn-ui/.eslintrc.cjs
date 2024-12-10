/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['plugin:@next/next/core-web-vitals', '@payloadcms'],
  ignorePatterns: ['**/payload-types.ts'],
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['*.js', '*.cjs', '*.json', '*.md', '*.yml', '*.yaml'],
    },
    {
      files: ['./src/**/*.ts', './src/**/*.tsx'],
      rules: {
        'no-restricted-exports': 'off',
        'perfectionist/sort-jsx-props': 'warn',
        'perfectionist/sort-objects': 'warn',
        'perfectionist/sort-named-exports': 'warn',
        'jsx-a11y/heading-has-content': 'warn',
        'jsx-a11y/html-has-lang': 'warn',
        'perfectionist/sort-imports': 'warn',
        'perfectionist/sort-named-imports': 'warn',
      },
    },
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  root: true,
}
