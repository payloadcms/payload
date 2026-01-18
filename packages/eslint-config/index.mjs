import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import perfectionist from 'eslint-plugin-perfectionist'
import { configs as regexpPluginConfigs } from 'eslint-plugin-regexp'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import payloadPlugin from '@ruya.sa/eslint-plugin'
import reactExtends from './configs/react/index.mjs'
import globals from 'globals'
import importX from 'eslint-plugin-import-x'
import typescriptParser from '@typescript-eslint/parser'
import { deepMerge } from './deepMerge.js'
import reactCompiler from 'eslint-plugin-react-compiler'
import vitest from '@vitest/eslint-plugin'

const baseRules = {
  // This rule makes no sense when overriding class methods. This is used a lot in richtext-lexical.
  'class-methods-use-this': 'off',
  curly: ['warn', 'all'],
  'arrow-body-style': 0,
  'import-x/prefer-default-export': 'off',
  'no-restricted-exports': ['warn', { restrictDefaultExports: { direct: true } }],
  'no-console': 'warn',
  'no-sparse-arrays': 'off',
  'no-underscore-dangle': 'off',
  'no-use-before-define': 'off',
  'object-shorthand': 'warn',
  'no-useless-escape': 'warn',
  'import-x/no-duplicates': 'warn',
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
  /*'perfectionist/sort-object-types': [
    'error',
    {
      partitionByNewLine: true,
    },
  ],
  'perfectionist/sort-interfaces': [
    'error',
    {
      partitionByNewLine': true,
    },
  ],*/
  'payload/no-jsx-import-statements': 'error',
}

const reactA11yRules = {
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
}

const typescriptRules = {
  '@typescript-eslint/no-use-before-define': 'off',

  // Type-aware any rules:
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/unbound-method': 'warn',
  '@typescript-eslint/consistent-type-imports': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  // Type-aware any rules end

  // ts-expect preferred over ts-ignore. It will error if the expected error is no longer present.
  '@typescript-eslint/ban-ts-comment': 'warn', // Recommended over deprecated @typescript-eslint/prefer-ts-expect-error: https://github.com/typescript-eslint/typescript-eslint/issues/8333. Set to warn to ease migration.
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
      caughtErrorsIgnorePattern: '^(_|ignore)',
    },
  ],
  '@typescript-eslint/no-base-to-string': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-redundant-type-constituents': 'warn',
  '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      // See https://github.com/typescript-eslint/typescript-eslint/issues/4619 and https://github.com/typescript-eslint/typescript-eslint/pull/4623
      // Don't want something like <button onClick={someAsyncFunction}> to error
      checksVoidReturn: {
        attributes: false,
        arguments: false,
      },
    },
  ],
  '@typescript-eslint/no-empty-object-type': 'warn',
}

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {FlatConfig} */
const baseExtends = deepMerge(
  js.configs.recommended,
  perfectionist.configs['recommended-natural'],
  regexpPluginConfigs['flat/recommended'],
)

/** @type {Config[]} */
export const rootEslintConfig = [
  {
    name: 'Settings',
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: {
          // This is necessary because `tsconfig.base.json` defines `"rootDir": "${configDir}/src"`,
          // And the following files aren't in src because they aren't transpiled.
          // This is typescript-eslint's way of adding files that aren't included in tsconfig.
          // See: https://typescript-eslint.io/troubleshooting/typed-linting/#i-get-errors-telling-me--was-not-found-by-the-project-service-consider-either-including-it-in-the-tsconfigjson-or-including-it-in-allowdefaultproject
          // The best practice is to have a tsconfig.json that covers ALL files and is used for
          // typechecking (with noEmit), and a `tsconfig.build.json` that is used for the build
          // (or alternatively, swc, tsup or tsdown). That's what we should ideally do, in which case
          // this hardcoded list wouldn't be necessary. Note that these files don't currently go
          // through ts, only through eslint.
          allowDefaultProject: [
            '../payload/bin.js',
            '../payload/bundle.js',
            '../next/babel.config.cjs',
            '../next/bundleScss.js',
            '../ui/babel.config.cjs',
            '../ui/bundle.js',
            '../graphql/bin.js',
            '../richtext-lexical/babel.config.cjs',
            '../richtext-lexical/bundle.js',
            '../richtext-lexical/scripts/translateNewKeys.ts',
            '../db-postgres/bundle.js',
            '../db-postgres/relationships-v2-v3.mjs',
            '../db-postgres/scripts/renamePredefinedMigrations.ts',
            '../db-sqlite/bundle.js',
            '../db-d1-sqlite/bundle.js',
            '../db-vercel-postgres/relationships-v2-v3.mjs',
            '../db-vercel-postgres/scripts/renamePredefinedMigrations.ts',
            '../plugin-cloud-storage/azure.d.ts',
            '../plugin-cloud-storage/azure.js',
            '../plugin-cloud-storage/gcs.d.ts',
            '../plugin-cloud-storage/gcs.js',
            '../plugin-cloud-storage/s3.d.ts',
            '../plugin-cloud-storage/s3.js',
            '../plugin-redirects/types.d.ts',
            '../plugin-redirects/types.js',
            '../translations/scripts/translateNewKeys/applyEslintFixes.ts',
            '../translations/scripts/translateNewKeys/findMissingKeys.ts',
            '../translations/scripts/translateNewKeys/generateTsObjectLiteral.ts',
            '../translations/scripts/translateNewKeys/index.ts',
            '../translations/scripts/translateNewKeys/run.ts',
            '../translations/scripts/translateNewKeys/sortKeys.ts',
            '../translations/scripts/translateNewKeys/translateText.ts',
            '../create-payload-app/bin/cli.js',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: typescriptParser,
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'import-x': importX,
    },
  },
  {
    name: 'TypeScript',
    // has 3 entries: https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/src/configs/recommended-type-checked.ts
    ...deepMerge(
      baseExtends,
      tseslint.configs.recommendedTypeChecked[0],
      tseslint.configs.recommendedTypeChecked[1],
      tseslint.configs.recommendedTypeChecked[2],
      eslintConfigPrettier,
      {
        plugins: {
          payload: payloadPlugin,
        },
        rules: {
          ...baseRules,
          ...typescriptRules,
        },
      },
    ),
    files: ['**/*.ts'],
  },
  {
    name: 'TypeScript-React',
    ...deepMerge(
      baseExtends,
      tseslint.configs.recommendedTypeChecked[0],
      tseslint.configs.recommendedTypeChecked[1],
      tseslint.configs.recommendedTypeChecked[2],
      reactExtends,
      eslintConfigPrettier,
      {
        plugins: {
          payload: payloadPlugin,
        },
        rules: {
          ...baseRules,
          ...typescriptRules,
          ...reactA11yRules,
        },
      },
    ),
    files: ['**/*.tsx'],
  },
  {
    name: 'Unit and Integration Tests',
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    files: ['**/*.spec.ts'],
    ignores: ['**/*.e2e.spec.ts'],
  },
  {
    name: 'Payload Config',
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'no-restricted-exports': 'off',
    },
    files: ['*.config.ts', 'config.ts'],
  },
  {
    name: 'React Compiler',
    ...reactCompiler.configs.recommended,
    files: ['**/*.tsx'],
  },
]

export default rootEslintConfig
