const baseRules = {
  // This rule makes no sense when overriding class methods. This is used a lot in richtext-lexical.
  'class-methods-use-this': 'off',
  'arrow-body-style': 0,
  'import/prefer-default-export': 'off',
  'no-restricted-exports': ['warn', { restrictDefaultExports: { direct: true } }],
  'no-console': 'warn',
  'no-sparse-arrays': 'off',
  'no-underscore-dangle': 'off',
  'no-use-before-define': 'off',
  'object-shorthand': 'warn',
  'no-useless-escape': 'warn',
  'import/no-duplicates': 'warn',
  'perfectionist/sort-objects': [
    'error',
    {
      type: 'natural',
      order: 'asc',
      'partition-by-comment': true,
      'partition-by-new-line': true,
      groups: ['top', 'unknown'],
      'custom-groups': {
        top: ['_id', 'id', 'name', 'slug', 'type'],
      },
    },
  ],
  /*'perfectionist/sort-object-types': [
    'error',
    {
      'partition-by-new-line': true,
    },
  ],
  'perfectionist/sort-interfaces': [
    'error',
    {
      'partition-by-new-line': true,
    },
  ],*/
  'payload/no-jsx-import-statements': 'error',
}

const reactRules = {
  'react/no-unused-prop-types': 'off',
  'react/prop-types': 'off',
  'react/require-default-props': 'off',
  'react/destructuring-assignment': 'warn',
  'react/no-unescaped-entities': 'warn',
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
}

const typescriptRules = {
  '@typescript-eslint/no-use-before-define': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',

  // Type-aware any rules:
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/unbound-method': 'warn',
  // This rule doesn't work well in .tsx files
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/consistent-type-imports': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  // Type-aware any rules end

  // ts-expect preferred over ts-ignore. It will error if the expected error is no longer present.
  '@typescript-eslint/prefer-ts-expect-error': 'error',
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
  '@typescript-eslint/no-base-to-string': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-redundant-type-constituents': 'warn',
  '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
  '@typescript-eslint/ban-types': 'warn',
}

const baseExtends = [
  'eslint:recommended',
  'plugin:perfectionist/recommended-natural',
  'plugin:regexp/recommended',
]

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: [
    '*.d.ts',
    '**/tsconfig.json',
    'package.json',
    '*.MD',
    '.tmp',
    '**/.git',
    '**/build',
    '**/dist/**',
    '**/node_modules',
    '**/temp',
    '*.yml',
    '*.json',
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import'], // Plugins are defined in the overrides to be more specific and only target the files they are meant for.
  overrides: [
    {
      files: ['**/*.ts'],
      plugins: ['@typescript-eslint', 'payload'],
      extends: [
        ...baseExtends,
        'plugin:@typescript-eslint/recommended-type-checked',
        'prettier', // prettier needs to come last. It disables eslint rules conflicting with prettier
      ],
      parser: '@typescript-eslint/parser',
      rules: {
        ...baseRules,
        ...typescriptRules,
      },
    },
    {
      files: ['**/*.tsx'],
      plugins: ['@typescript-eslint', 'payload'],
      extends: [
        ...baseExtends,
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        './configs/react/index.js',
        'prettier', // prettier needs to come last. It disables eslint rules conflicting with prettier
      ],
      parser: '@typescript-eslint/parser',
      rules: {
        ...baseRules,
        ...typescriptRules,
        ...reactRules,
      },
    },
    {
      files: ['**/*.spec.ts'],
      plugins: ['@typescript-eslint', 'payload'],
      extends: [
        ...baseExtends,
        'plugin:@typescript-eslint/recommended-type-checked',
        './configs/jest/index.js',
        'prettier', // prettier needs to come last. It disables eslint rules conflicting with prettier
      ],
      parser: '@typescript-eslint/parser',
      rules: {
        ...baseRules,
        ...typescriptRules,
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      plugins: ['payload'],
      files: ['*.config.ts'],
      rules: {
        ...baseRules,
        ...typescriptRules,
        'no-restricted-exports': 'off',
      },
    },
    {
      plugins: ['payload'],
      files: ['config.ts'],
      rules: {
        ...baseRules,
        ...typescriptRules,
        'no-restricted-exports': 'off',
      },
    },
  ],
  rules: {}, // Rules are defined in the overrides to be more specific and only target the files they are meant for.
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
}
