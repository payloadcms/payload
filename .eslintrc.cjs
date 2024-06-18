/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@payloadcms'],
  ignorePatterns: ['README.md', 'packages/**/*.spec.ts'],
  overrides: [
    {
      files: ['packages/**'],
      plugins: ['payload'],
      rules: {
        'payload/no-jsx-import-statements': 'warn',
        'payload/no-relative-monorepo-imports': 'error',
        'payload/no-imports-from-exports-dir': 'error',
      },
    },
    {
      files: ['scripts/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
        'perfectionist/sort-object-types': 'off',
        'perfectionist/sort-objects': 'off',
      },
    },
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
    {
      files: ['templates/vercel-postgres/**'],
      rules: {
        'no-restricted-exports': 'off',
      },
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
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
    EXPERIMENTAL_useProjectService: true,
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  root: true,
}
