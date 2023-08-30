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
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:perfectionist/recommended-natural',
    'plugin:@typescript-eslint/strict',
    'plugin:regexp/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    './configs/jest/index.cjs',
    './configs/react/index.cjs',
    'prettier',
  ],
  rules: {
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
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',
  },
};
