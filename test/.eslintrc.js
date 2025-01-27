module.exports = {
  extends: ['@payloadcms'],
  ignorePatterns: ['**/payload-types.ts'],
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
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        // turn the @typescript-eslint/unbound-method rule off *only* for test files. See https://typescript-eslint.io/rules/unbound-method/#when-not-to-use-it
        '@typescript-eslint/unbound-method': 'off',
        'no-console': 'off',
        'perfectionist/sort-objects': 'off',
      },
    },
    {
      files: ['**/int.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/prefer-strict-equal': 'off',
      },
    },
    {
      extends: ['plugin:playwright/playwright-test'],
      files: ['**/e2e.spec.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/consistent-test-it': 'off',
        'jest/expect-expect': 'off',
        'jest/no-test-callback': 'off',
        'jest/prefer-strict-equal': 'off',
        'jest/require-top-level-describe': 'off',
        'jest-dom/prefer-to-have-attribute': 'off',
      },
    },
    {
      files: ['*.e2e.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/expect-expect': 'off',
      },
    },
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  root: true,
}
