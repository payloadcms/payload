import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from 'eslint-plugin-payload'

export const defaultESLintIgnores = [
  '.tmp',
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/.yarn/**',
  '**/build',
  '**/dist/**',
  '**/node_modules',
  '**/temp',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
]

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

export const rootParserOptions = {
  EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
  EXPERIMENTAL_useProjectService: {
    allowDefaultProjectForFiles: ['./*.ts', './*.tsx'],
  },
  sourceType: 'module',
  ecmaVersion: 'latest',
}

/** @type {FlatConfig[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [...defaultESLintIgnores, 'test/live-preview/next-app', 'packages/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
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
