const { CODE_FILE_EXTENSIONS } = require('../constants')

module.exports = {
  env: {
    es6: true,
  },
  extends: ['plugin:import/errors', 'plugin:import/warnings', 'plugin:import/typescript'],
  plugins: ['import', 'simple-import-sort'],
  settings: {
    'import/resolver': {
      node: {
        extensions: CODE_FILE_EXTENSIONS,
      },
    },
    'import/extensions': CODE_FILE_EXTENSIONS,
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
  },
  rules: {
    'import/no-unresolved': 'off',
    'import/no-default-export': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^react', '^@?\\w'],
          ['^(@components|@root|@utils|@scss|@hooks)(/.*|$)', '^\\.((?!.scss).)*$'],
          ['^[^.]'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
    'import/no-extraneous-dependencies': 'off',
    'import/named': 'error',
    'import/no-relative-packages': 'warn',
    'import/no-import-module-exports': 'warn',
    'import/no-cycle': 'warn',
    'import/no-duplicates': 'error',
  },
}
