import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from '@payloadcms/eslint-plugin'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
  '**/*.spec.ts',
  'next-env.d.ts',
]

/** @typedef {import('eslint').Linter.Config} Config */

export const rootParserOptions = {
  sourceType: 'module',
  ecmaVersion: 'latest',
  projectService: {
    maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 40,
    allowDefaultProject: ['scripts/*.ts', '*.js', '*.mjs', '*.d.ts'],
  },
}

/** @type {Config[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [
      ...defaultESLintIgnores,
      'packages/eslint-*/**',
      'test/live-preview/next-app',
      'packages/**/*.spec.ts',
      'templates/**',
      'examples/**',
    ],
  },
  {
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      'payload/no-imports-from-exports-dir': 'error',
      'payload/no-imports-from-self': 'error',
      'payload/proper-payload-logger-usage': 'error',
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
    files: ['tools/**/*.ts'],
    rules: {
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
]

export default [
  ...rootEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        ...rootParserOptions,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['packages/eslint-config/**/*.ts'],
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
