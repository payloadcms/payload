import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from 'eslint-plugin-payload'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: ['README.md', 'packages/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigDirName: import.meta.dirname,
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
        EXPERIMENTAL_useProjectService: true,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      'payload/no-imports-from-exports-dir': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['packages/eslint-config-payload/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['templates/vercel-postgres/**'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
]

export default rootEslintConfig
