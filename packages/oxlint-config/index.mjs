import eslintReact from '@eslint-react/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import perfectionist from 'eslint-plugin-perfectionist'
import playwright from 'eslint-plugin-playwright'
import { configs as regexpConfigs } from 'eslint-plugin-regexp'
import { createRequire } from 'node:module'
import { reactA11yRules } from './react-a11y.mjs'

const require = createRequire(import.meta.url)
const requireFromESLintReact = createRequire(require.resolve('@eslint-react/eslint-plugin'))

/** eslint-plugin-playwright's recommended rules, for the e2e test override in the root config. */
export const playwrightRecommendedRules = playwright.configs['flat/recommended'].rules

/**
 * Payload's shared oxlint config. It runs the ESLint plugins Payload used before as oxlint JS
 * plugins, so rule names and existing `eslint-disable` comments keep working.
 *
 * @satisfies {import('oxlint').OxlintConfig}
 */
const config = {
  categories: {
    correctness: 'off',
  },
  env: {
    builtin: true,
    commonjs: true,
    es2026: true,
    node: true,
  },
  jsPlugins: [
    { name: 'payload', specifier: require.resolve('@payloadcms/oxlint-plugin') },
    { name: 'perfectionist', specifier: require.resolve('eslint-plugin-perfectionist') },
    { name: 'playwright', specifier: require.resolve('eslint-plugin-playwright') },
    { name: 'regexp', specifier: require.resolve('eslint-plugin-regexp') },
    // `vitest` is reserved for oxlint's native plugin, which can't recognize custom `test` imports
    { name: '@vitest', specifier: require.resolve('@vitest/eslint-plugin') },
    // `@eslint-react/eslint-plugin` bundles these plugins. oxlint reads `@eslint-react/dom/rule` as
    // plugin `@eslint-react/dom`, so each one is loaded under the name ESLint used.
    { name: '@eslint-react', specifier: requireFromESLintReact.resolve('eslint-plugin-react-x') },
    {
      name: '@eslint-react/dom',
      specifier: requireFromESLintReact.resolve('eslint-plugin-react-dom'),
    },
    {
      name: '@eslint-react/hooks-extra',
      specifier: requireFromESLintReact.resolve('eslint-plugin-react-hooks-extra'),
    },
    {
      name: '@eslint-react/naming-convention',
      specifier: requireFromESLintReact.resolve('eslint-plugin-react-naming-convention'),
    },
    {
      name: '@eslint-react/web-api',
      specifier: requireFromESLintReact.resolve('eslint-plugin-react-web-api'),
    },
  ],
  // Native versions of ESLint plugins whose names oxlint reserves (`import-x` is `import`,
  // `react-hooks` rules are in `react`). Existing `eslint-disable` comments for them still apply.
  // `typescript` also runs the type-aware rules, which JS plugins can't.
  plugins: ['typescript', 'import', 'react', 'jsx-a11y'],
  settings: eslintReact.configs['recommended-type-checked'].settings,
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        ...perfectionist.configs['recommended-natural'].rules,
        ...regexpConfigs['flat/recommended'].rules,
        'for-direction': 'error',
        'no-async-promise-executor': 'error',
        'no-case-declarations': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-dupe-else-if': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-empty-pattern': 'error',
        'no-empty-static-block': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        'no-fallthrough': 'error',
        'no-global-assign': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-nonoctal-decimal-escape': 'error',
        'no-prototype-builtins': 'error',
        'no-self-assign': 'error',
        'no-shadow-restricted-names': 'error',
        'no-unsafe-finally': 'error',
        // TODO: back to 'error' once fixed. This version flags more than the ESLint one.
        'no-unsafe-optional-chaining': 'warn',
        'no-unused-labels': 'error',
        'no-unused-private-class-members': 'error',
        'no-unused-vars': [
          'warn',
          {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: false,
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^(_|ignore)',
          },
        ],
        'no-useless-catch': 'error',
        'no-useless-escape': 'warn',
        'no-with': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        'perfectionist/sort-objects': [
          'error',
          {
            type: 'natural',
            order: 'asc',
            partitionByComment: true,
            partitionByNewLine: true,
            groups: ['top', 'unknown'],
            customGroups: {
              top: ['_id', 'id', 'name', 'slug', 'type'],
            },
          },
        ],
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'no-array-constructor': 'error',
        'no-unused-expressions': 'error',
        curly: ['warn', 'all'],
        'no-console': 'warn',
        'object-shorthand': 'warn',
        'payload/no-conflicting-lexical-markdown-imports': 'warn',
        'import/no-duplicates': 'warn',
        // TODO: back to 'error' once fixed. This version flags more than the ESLint one.
        'typescript/await-thenable': 'warn',
        'typescript/ban-ts-comment': 'warn',
        'typescript/no-array-delete': 'error',
        'typescript/no-base-to-string': 'warn',
        'typescript/no-duplicate-enum-values': 'error',
        'typescript/no-duplicate-type-constituents': 'error',
        'typescript/no-empty-object-type': 'warn',
        'typescript/no-explicit-any': 'warn',
        'typescript/no-extra-non-null-assertion': 'error',
        'typescript/no-floating-promises': 'error',
        'typescript/no-for-in-array': 'error',
        'typescript/no-implied-eval': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-misused-promises': [
          'error',
          {
            checksVoidReturn: {
              attributes: false,
              arguments: false,
            },
          },
        ],
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-asserted-optional-chain': 'error',
        'typescript/no-redundant-type-constituents': 'warn',
        'typescript/no-require-imports': 'error',
        'typescript/no-this-alias': 'error',
        /**
         * Off because its autofix breaks code. tsgolint ports the check typescript-eslint added in
         * 8.59.0, which reports an assertion as unnecessary if the value would fit where it's used
         * without it. The rule only sees the types with the assertion in place, so it can't tell
         * when the code around it depends on the assertion (typescript-eslint#12376).
         *
         * In this monorepo it reported 368 assertions that ESLint's version (typescript-eslint
         * 8.26.1) didn't. 10 of them were false positives: removing them with `--fix` broke the
         * build of payload, plugin-ecommerce and richtext-lexical (9) and a tstyche type test (1).
         */
        'typescript/no-unnecessary-type-assertion': 'off',
        'typescript/no-unnecessary-type-constraint': 'warn',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/no-unsafe-enum-comparison': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-unsafe-unary-minus': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/only-throw-error': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/prefer-namespace-keyword': 'error',
        'typescript/prefer-promise-reject-errors': 'error',
        'typescript/require-await': 'error',
        'typescript/restrict-plus-operands': 'error',
        'typescript/restrict-template-expressions': 'warn',
        'typescript/triple-slash-reference': 'error',
        'typescript/unbound-method': 'warn',
        'typescript/consistent-type-imports': 'warn',
        'no-restricted-exports': [
          'warn',
          {
            restrictDefaultExports: {
              direct: true,
            },
          },
        ],
        /**
         * React's rules check `.ts` files too, not just `.tsx`. Custom hooks often live in `.ts` files,
         * and the build runs React Compiler on every file with `'use client'`, including `.ts` ones.
         */
        ...eslintReact.configs['recommended-type-checked'].rules,
        '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
        '@eslint-react/naming-convention/use-state': 'off',
        '@eslint-react/dom/no-dangerously-set-innerhtml': 'off',
        '@eslint-react/dom/no-dangerously-set-innerhtml-with-children': 'off',
        '@eslint-react/no-unsafe-component-will-mount': 'off',
        '@eslint-react/no-unsafe-component-will-receive-props': 'off',
        '@eslint-react/no-unsafe-component-will-update': 'off',
        '@eslint-react/no-set-state-in-component-did-mount': 'off',
        '@eslint-react/no-set-state-in-component-did-update': 'off',
        '@eslint-react/no-set-state-in-component-will-update': 'off',
        '@eslint-react/no-missing-component-display-name': 'off',
        '@eslint-react/no-direct-mutation-state': 'off',
        '@eslint-react/no-array-index-key': 'off',
        '@eslint-react/no-unstable-default-props': 'off', // TODO: Evaluate enabling this
        '@eslint-react/no-unstable-context-value': 'off', // TODO: Evaluate enabling this
        ...reactA11yRules,
        // Needs type information, which oxlint doesn't give JS plugins
        '@eslint-react/no-leaked-conditional-rendering': 'off',
        // React
        'react-hooks/exhaustive-deps': 'warn',
        // TODO: back to 'error' once fixed. This version flags more than the ESLint one.
        'react-hooks/rules-of-hooks': 'warn',
        // React Compiler
        'react-hooks/error-boundaries': 'error',
        'react-hooks/globals': 'error',
        'react-hooks/hooks': 'error',
        'react-hooks/immutability': 'error',
        'react-hooks/incompatible-library': 'warn',
        'react-hooks/invariant': 'error',
        // TODO: 'error' once all its findings are fixed
        'react-hooks/preserve-manual-memoization': 'warn',
        'react-hooks/purity': 'error',
        // TODO: 'error' once all its findings are fixed
        'react-hooks/refs': 'warn',
        'react-hooks/rule-suppression': 'error',
        // TODO: 'error' once all its findings are fixed
        'react-hooks/set-state-in-effect': 'warn',
        'react-hooks/set-state-in-render': 'error',
        // TODO: 'error' once all its findings are fixed
        'react-hooks/static-components': 'warn',
        'react-hooks/syntax': 'error',
        'react-hooks/unsupported-syntax': 'warn',
        'react-hooks/use-memo': 'error',
        'react-hooks/void-use-memo': 'error',
      },
    },
    {
      files: ['**/*.spec.ts'],
      excludeFiles: ['**/*.e2e.spec.ts'],
      // `vitest` is loaded as `@vitest` (see `jsPlugins`), so the preset's rule names need the new prefix
      rules: Object.fromEntries(
        Object.entries(vitest.configs.recommended.rules).map(([rule, value]) => [
          rule.replace('vitest/', '@vitest/'),
          value,
        ]),
      ),
    },
    {
      files: ['**/*.config.ts', '**/config.ts'],
      rules: {
        'no-restricted-exports': 'off',
      },
    },
  ],
}

export default config
