import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from '@payloadcms/eslint-plugin'
import mdxTextParser from '@payloadcms/eslint-plugin/customRules/mdx-text-parser.js'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/vite.tanstack.config.ts',
  '**/vitest.config.ts',
  '**/vitest.setup.ts',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
  'packages/**/*.spec.ts',
  'next-env.d.ts',
  '**/app',
  // The TanStack app dirs (shippable `app-tanstack` + its test duplicates) are
  // thin app wiring; their `app/` routes are already ignored above, and these
  // dirs carry no tsconfig of their own. The adapter logic lives in
  // `packages/tanstack-start` and is linted there.
  '**/app-tanstack/components/**',
  '**/app-tanstack/router.tsx',
  'src/**/*.spec.ts',
  'packages/payload/rollup.dts.config.mjs',
  'scripts/**/*.js',
  'packages/plugin-mcp/bin.js',
]

/** @typedef {import('eslint').Linter.Config} Config */

export const rootParserOptions = {
  sourceType: 'module',
  ecmaVersion: 'latest',
  projectService: true,
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
      'packages/drizzle/src/postgres/predefinedMigrations/v2-v3/**',
      'packages/drizzle/src/postgres/predefinedMigrations/localize-status/**',
      'packages/drizzle/src/sqlite/predefinedMigrations/localize-status/**',
      'packages/codemod/src/transforms/**/*.input.ts',
      'packages/codemod/src/transforms/**/*.output.ts',
      'packages/tanstack-start/scripts/**',
      'packages/tanstack-start/test/**',
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
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
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
      'payload/no-relative-monorepo-imports': 'off',
    },
  },
]

export default [
  ...rootEslintConfig,
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
  // MDX/Markdown documentation linting for code block languages
  {
    files: ['docs/**/*.mdx', 'docs/**/*.md'],
    plugins: {
      payload: payloadPlugin,
    },
    languageOptions: {
      parser: mdxTextParser,
    },
    rules: {
      'payload/valid-code-block-languages': 'error',
    },
  },
]
