module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:perfectionist/recommended-natural',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:regexp/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    './configs/jest/index.cjs',
    './configs/react/index.cjs',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-use-before-define': 'off',
    'arrow-body-style': 0,
    'import/prefer-default-export': 'off',
    'no-console': 'warn',
    'no-sparse-arrays': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'react/no-unused-prop-types': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
