/** @type {import('prettier').Config} */
module.exports = {
  root: true,
  extends: ['@payloadcms'],
  ignorePatterns: ['**/payload-types.ts'],
  overrides: [
    {
      files: ['test/**/*.ts'],
      rules: {
        'perfectionist/sort-objects': 'off',
      }
    },
    {
      files: ['test/**/int.spec.ts'],
      rules: {
        'jest/prefer-strict-equal': 'off',
      },
    },
    {
      files: ['test/**/e2e.spec.ts'],
      extends: ['plugin:playwright/playwright-test'],
      rules: {
        'jest/consistent-test-it': 'off',
        'jest/require-top-level-describe': 'off',
        'jest/no-test-callback': 'off',
        'jest/prefer-strict-equal': 'off',
        'jest/expect-expect': 'off',
        'jest-dom/prefer-to-have-attribute': 'off',
      },
    },
    {
      files: ['*.e2e.ts'],
      rules: {
        'jest/expect-expect': 'off',
      },
    },
  ],
}
