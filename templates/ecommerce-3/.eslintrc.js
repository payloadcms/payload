/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['plugin:@next/next/recommended', '@payloadcms'],
  ignorePatterns: ['**/payload-types.ts'],
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['*.js', '*.cjs', '*.json', '*.md', '*.yml', '*.yaml'],
    },
    {
      files: ['package.json', 'tsconfig.json'],
      rules: {
        'perfectionist/sort-array-includes': 'off',
        'perfectionist/sort-astro-attributes': 'off',
        'perfectionist/sort-classes': 'off',
        'perfectionist/sort-enums': 'off',
        'perfectionist/sort-exports': 'off',
        'perfectionist/sort-imports': 'off',
        'perfectionist/sort-interfaces': 'off',
        'perfectionist/sort-jsx-props': 'off',
        'perfectionist/sort-keys': 'off',
        'perfectionist/sort-maps': 'off',
        'perfectionist/sort-named-exports': 'off',
        'perfectionist/sort-named-imports': 'off',
        'perfectionist/sort-object-types': 'off',
        'perfectionist/sort-objects': 'off',
        'perfectionist/sort-svelte-attributes': 'off',
        'perfectionist/sort-union-types': 'off',
        'perfectionist/sort-vue-attributes': 'off',
      },
    },
    {
      files: ['*.tsx'],
      rules: {
        'no-restricted-exports': 'off',
      },
    },
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  root: true,
}
