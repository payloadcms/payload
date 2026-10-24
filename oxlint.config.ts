import payloadConfig, { playwrightRecommendedRules } from '@payloadcms/oxlint-config'
import { createRequire } from 'node:module'
import { defineConfig } from 'oxlint'

const requireFromRichtextLexical = createRequire(
  new URL('./packages/richtext-lexical/package.json', import.meta.url),
)

export default defineConfig({
  ...payloadConfig,
  jsPlugins: [
    ...payloadConfig.jsPlugins,
    { name: '@lexical', specifier: requireFromRichtextLexical.resolve('@lexical/eslint-plugin') },
  ],
  ignorePatterns: [
    '**/.temp',
    '**/.*',
    '**/.git',
    '**/.hg',
    '**/.pnp.*',
    '**/.svn',
    '**/oxfmt.config.ts',
    '**/oxlint.config.ts',
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
    'packages/**/*.spec.*',
    'next-env.d.ts',
    '**/app',
    '**/app-tanstack/components/**',
    '**/app-tanstack/router.tsx',
    'src/**/*.spec.*',
    'tools/**/*.spec.*',
    'packages/payload/rollup.dts.config.mjs',
    'scripts/**/*.js',
    'packages/plugin-mcp/bin.js',
    'packages/translations/bundleDateFNSLocales.js',
    'packages/translations/verifyDateFNSLocales.js',
    'packages/oxlint-*/**',
    'test/live-preview/next-app',
    'templates/**',
    'examples/**',
    'packages/drizzle/src/postgres/predefinedMigrations/v2-v3/**',
    'packages/drizzle/src/postgres/predefinedMigrations/localize-status/**',
    'packages/drizzle/src/sqlite/predefinedMigrations/localize-status/**',
    'packages/codemod/src/transforms/**/*.input.ts',
    'packages/codemod/src/transforms/**/*.output.ts',
    'packages/codemod/scripts/**',
    'packages/tanstack-start/scripts/**',
    'packages/tanstack-start/test/**',
  ],
  options: {
    reportUnusedDisableDirectives: 'error',
    typeAware: true,
  },
  rules: {
    'payload/no-jsx-import-statements': 'warn',
    'payload/no-relative-monorepo-imports': 'error',
    'payload/no-imports-from-exports-dir': 'error',
    'payload/no-imports-from-self': 'error',
    'payload/proper-payload-logger-usage': 'error',
  },
  settings: {
    ...payloadConfig.settings,
    vitest: {
      // Modules that re-export Vitest's `test`/`it`, so Vitest rules treat them like Vitest's own.
      // These must be exact import paths: oxlint doesn't pass regexes in settings to JS plugins.
      vitestImports: [
        '../__helpers/int/vitest.js',
        '../../__helpers/int/vitest.js',
        '../__helpers/memory/vitest.js',
        '../int/vitest.js',
        './helpers/mcpFixtures.js',
      ],
    },
  },
  overrides: [
    ...payloadConfig.overrides,
    { files: ['test/evals/eval-results/**'], rules: { 'no-restricted-exports': 'off' } },
    // `@lexical/eslint-plugin`'s recommended rules
    { files: ['packages/richtext-lexical/**'], rules: { '@lexical/rules-of-lexical': 'warn' } },
    {
      files: ['packages/ui/**/*.{ts,tsx}'],
      rules: {
        'no-console': 'error',
      },
    },
    {
      files: [
        'packages/tanstack-start/src/elements/RouterAdapter/**/*.{ts,tsx}',
        'packages/tanstack-start/src/routes/**/*.{ts,tsx}',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                message:
                  'Import from a targeted @payloadcms/ui subpath in the TanStack route graph.',
                name: '@payloadcms/ui',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'perfectionist/sort-object-types': 'off',
        'perfectionist/sort-objects': 'off',
        'no-unused-vars': 'off',
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
    {
      files: ['test/**/*.ts'],
      rules: {
        'no-console': 'off',
        'perfectionist/sort-objects': 'off',
        // Vitest and Playwright fixtures call a `use` callback, and some test helpers are named
        // `use…`, so this rule mistakes them for React hooks
        'react-hooks/rules-of-hooks': 'off',
        'no-use-before-define': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/unbound-method': 'off',
      },
    },
    {
      files: ['test/**/*.int.spec.ts', 'test/**/int.spec.ts'],
      rules: {
        '@vitest/no-standalone-expect': [
          'error',
          {
            additionalTestBlockFunctions: ['it.options', 'test.options', 'describe.options', 'it'],
          },
        ],
        'typescript/no-explicit-any': 'off',
      },
    },
    {
      files: ['test/**/*.e2e.spec.ts', 'test/**/e2e.spec.ts', 'test/helpers.ts'],
      rules: {
        ...playwrightRecommendedRules,
        'playwright/expect-expect': [
          'error',
          {
            assertFunctionNames: [
              'assertToastErrors',
              'saveDocAndAssert',
              'runFilterOptionsTest',
              'assertNetworkRequests',
              'assertRequestBody',
              'expectNoResultsAndCreateFolderButton',
              'expectPaintContrast',
              'expectTextContrast',
              'createFolder',
              'createFolderFromDoc',
              'assertURLParams',
              'uploadImage',
              'getRowByCellValueAndAssert',
              'assertAllElementsHaveFocusIndicators',
              'assertNoHorizontalOverflow',
            ],
          },
        ],
        'playwright/prefer-web-first-assertions': 'error',
        'payload/no-flaky-assertions': 'warn',
        'payload/no-wait-function': 'warn',
        'no-use-before-define': 'off',
        'typescript/no-unsafe-assignment': 'off',
      },
    },
    {
      files: ['test/*.e2e.ts'],
      rules: {
        'no-use-before-define': 'off',
        'typescript/no-unsafe-assignment': 'off',
      },
    },
  ],
})
