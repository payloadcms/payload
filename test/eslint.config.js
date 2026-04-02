import { defaultESLintIgnores, rootEslintConfig, rootParserOptions } from '../eslint.config.js'
import payloadPlugin from '@payloadcms/eslint-plugin'
import playwright from 'eslint-plugin-playwright'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const testEslintConfig = [
  ...rootEslintConfig,
  {
    ignores: [...defaultESLintIgnores, '**/payload-types.ts'],
  },
  {
    rules: {
      'payload/no-relative-monorepo-imports': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      // turn the @typescript-eslint/unbound-method rule off *only* for test files. See https://typescript-eslint.io/rules/unbound-method/#when-not-to-use-it
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['**/*.config.ts', '**/config.ts'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
  {
    files: ['**/*.int.spec.ts', '**/int.spec.ts'],
    settings: {
      vitest: {
        // See https://github.com/vitest-dev/eslint-plugin-vitest?tab=readme-ov-file#custom-fixtures
        // This ensures that the eslint plugin recognizes the `it` wrapper function in our helpers/int/vitest.ts file.
        vitestImports: [/helpers\/int\/vitest/],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.e2e.spec.ts', '**/e2e.spec.ts', 'helpers.ts'],
  },
  {
    files: ['**/*.e2e.spec.ts', '**/e2e.spec.ts', 'helpers.ts'],
    rules: {
      'payload/no-relative-monorepo-imports': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'playwright/prefer-web-first-assertions': 'error',
      'payload/no-flaky-assertions': 'warn',
      'payload/no-wait-function': 'warn',
      // Enable the no-non-retryable-assertions rule ONLY for hunting for flakes
      // 'payload/no-non-retryable-assertions': 'error',
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
    },
  },
  {
    files: ['*.e2e.ts'],
    rules: {
      'payload/no-relative-monorepo-imports': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
]

export default testEslintConfig
