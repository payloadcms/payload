module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:perfectionist/recommended-natural',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:regexp/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    './configs/jest/index.js',
    './configs/react/index.js',
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
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
    },
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // Type-aware any rules:
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    // This rule doesn't work well in .tsx files
    '@typescript-eslint/no-misused-promises': 'off',
    // Type-aware any rules end

    // ts-expect should always be preferred over ts-ignore
    '@typescript-eslint/prefer-ts-expect-error': 'warn',

    // This rule makes no sense when overriding class methods. This is used a lot in richtext-lexical.
    'class-methods-use-this': 'off',

    // By default, it errors for unused variables. This is annoying, warnings are enough.
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^ignore',
      },
    ],

    '@typescript-eslint/no-use-before-define': 'off',
    'arrow-body-style': 0,
    'import/prefer-default-export': 'off',
    'no-console': 'warn',
    'no-sparse-arrays': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'object-shorthand': 'warn',
    'react/no-unused-prop-types': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',

    'perfectionist/sort-objects': [
      'error',
      {
        type: 'natural',
        order: 'asc',
        'partition-by-comment': true,
        groups: ['top', 'unknown'],
        'custom-groups': {
          top: ['_id', 'id', 'name', 'slug', 'type'],
        },
      },
    ],
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
}
