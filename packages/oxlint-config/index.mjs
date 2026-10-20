import eslintReact from '@eslint-react/eslint-plugin'
import vitest from '@vitest/eslint-plugin'
import perfectionist from 'eslint-plugin-perfectionist'
import playwright from 'eslint-plugin-playwright'
import { configs as regexpConfigs } from 'eslint-plugin-regexp'
import { createRequire } from 'node:module'

import reactExtends from './configs/react/index.mjs'

const reactA11yRules = {
  'jsx-a11y/anchor-is-valid': 'warn',
  // ESLint ran this with jsx-a11y's defaults, which check `<input>` and `<textarea>` too. oxlint's
  // defaults skip them, so pass jsx-a11y's defaults explicitly.
  'jsx-a11y/control-has-associated-label': ['warn', { ignoreElements: [], ignoreRoles: [] }],
  // ESLint ran this with jsx-a11y's default handlers, which include `onMouseEnter` and
  // `onMouseLeave`. oxlint's defaults skip them, so pass jsx-a11y's defaults explicitly.
  'jsx-a11y/no-static-element-interactions': [
    'warn',
    {
      handlers: [
        'onFocus',
        'onBlur',
        'onKeyDown',
        'onKeyPress',
        'onKeyUp',
        'onClick',
        'onContextMenu',
        'onDblClick',
        'onDoubleClick',
        'onDrag',
        'onDragEnd',
        'onDragEnter',
        'onDragExit',
        'onDragLeave',
        'onDragOver',
        'onDragStart',
        'onDrop',
        'onMouseDown',
        'onMouseEnter',
        'onMouseLeave',
        'onMouseMove',
        'onMouseOut',
        'onMouseOver',
        'onMouseUp',
      ],
    },
  ],
  'jsx-a11y/label-has-associated-control': 'warn',
}

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
      },
    },
    {
      files: ['**/*.tsx'],
      ...reactExtends,
      rules: {
        ...reactExtends.rules,
        ...reactA11yRules,
        // TODO: back to 'error' once fixed. This version flags more than the ESLint one.
        'jsx-a11y/role-has-required-aria-props': 'warn',
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
      files: ['**/*.tsx'],
      // React's recommended React Compiler checks (the `recommended-latest` preset of
      // `eslint-plugin-react-hooks`), using oxlint's built-in port of the compiler. `hooks`,
      // `invariant`, `rule-suppression` and `syntax` aren't in the preset, but React Compiler skips
      // optimizing components they report. Severities are the ones React gives each rule, except
      // where noted. `todo` is left out: it reports syntax the compiler doesn't support yet, which
      // React treats as a hint.
      rules: {
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
      files: ['**/*.config.ts', '**/config.ts'],
      rules: {
        'no-restricted-exports': 'off',
      },
    },
  ],
}

export default config
