/** @type {import('prettier').Config} */
module.exports = {
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
      extends: ['plugin:playwright/playwright-test'],
      files: ['test/**/e2e.spec.ts'],
      rules: {
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
        'jest/expect-expect': 'off',
      },
    },
  ],
  root: true,
}
