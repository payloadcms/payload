/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ['payload-types.ts'],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['payload'],
  rules: {
    'payload/no-relative-monorepo-imports': 'error',
  },
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: [
        '*.js',
        '*.cjs',
        'playwright.config.ts',
        'playwright.bail.config.ts',
        'bin-cks.cjs',
        'bin-esm.mjs',
        'esm-loader.mjs',
        'esm-loader-playwright.mjs',
        '*.json',
        '*.md',
        '*.yml',
        '*.yaml',
      ],
    },
    {
      files: ['**/*.ts'],
      rules: {
        'payload/no-jsx-import-statements': 'warn',
        'payload/no-relative-monorepo-imports': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        // turn the @typescript-eslint/unbound-method rule off *only* for test files. See https://typescript-eslint.io/rules/unbound-method/#when-not-to-use-it
        '@typescript-eslint/unbound-method': 'off',
        'no-console': 'off',
        'perfectionist/sort-objects': 'off',
      },
    },
    {
      files: ['**/*.int.spec.ts', '**/int.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'jest/prefer-strict-equal': 'off',
      },
    },
    {
      extends: ['plugin:playwright/recommended'],
      files: ['**/*.e2e.spec.ts', '**/e2e.spec.ts', 'helpers.ts'],
      rules: {
        'payload/no-relative-monorepo-imports': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/consistent-test-it': 'off',
        'jest/expect-expect': 'off',
        'jest/no-test-callback': 'off',
        'jest/prefer-strict-equal': 'off',
        'jest/require-top-level-describe': 'off',
        'jest-dom/prefer-to-have-attribute': 'off',
        'playwright/prefer-web-first-assertions': 'error',
        'payload/no-flaky-assertions': 'warn',
        'payload/no-wait-function': 'warn',
        // Enable the no-non-retryable-assertions rule ONLY for hunting for flakes
        // 'payload/no-non-retryable-assertions': 'error',
      },
    },
    {
      files: ['*.e2e.ts'],
      rules: {
        'payload/no-relative-monorepo-imports': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/expect-expect': 'off',
      },
    },
  ],
}
