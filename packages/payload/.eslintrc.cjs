const path = require('path');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: ['./eslint-config/index.cjs', 'prettier'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  overrides: [
    {
      files: ['test/**/int.spec.ts'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/consistent-type-imports': 'warn',
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
      files: ['*.spec.ts'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
    {
      files: ['*.e2e.ts'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/expect-expect': 'off',
      },
    },
  ],
  rules: {
    'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'import/prefer-default-export': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/no-unused-prop-types': 'off',
    'no-console': 'warn',
    'no-sparse-arrays': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'arrow-body-style': 0,
    '@typescript-eslint/no-use-before-define': 'off',
  },
};
