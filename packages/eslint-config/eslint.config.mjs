/* eslint-disable perfectionist/sort-imports */
/* eslint-disable perfectionist/sort-objects */
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import perfectionist from 'eslint-plugin-perfectionist'
import { configs as regexpPluginConfigs } from 'eslint-plugin-regexp'
import eslintConfigPrettier from 'eslint-config-prettier'
import payloadPlugin from '@payloadcms/eslint-plugin'
import reactExtends from './configs/react/index.mjs'
import jestExtends from './configs/jest/index.mjs'
import globals from 'globals'
import importX from 'eslint-plugin-import-x'
import typescriptParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.RulesRecord} */
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
  'payload/no-jsx-import-statements': 'error',
}

/** @type {import('eslint').Linter.RulesRecord} */
const reactA11yRules = {
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
}

/** @type {import('eslint').Linter.RulesRecord} */
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

export const rootEslintConfig = tseslint.config(
  {
    name: 'Base',
    extends: [
      js.configs.recommended,
      perfectionist.configs['recommended-natural'],
      regexpPluginConfigs['flat/recommended'],
    ],
  },
  {
    name: 'Settings',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: typescriptParser,
    },
    plugins: {
      'import-x': importX,
    },
  },
  {
    name: 'TypeScript',
    extends: [...tseslint.configs.recommendedTypeChecked, eslintConfigPrettier],
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
    },
  },
  {
    name: 'TypeScript-React',
    extends: [...tseslint.configs.recommendedTypeChecked, reactExtends, eslintConfigPrettier],
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
      ...reactA11yRules,
    },
    files: ['**/*.tsx'],
  },
  {
    name: 'Unit Tests',
    extends: [jestExtends],
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
      '@typescript-eslint/unbound-method': 'off',
    },
    files: ['**/*.spec.ts'],
  },
  {
    name: 'Payload Config',
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
      'no-restricted-exports': 'off',
    },
    files: ['*.config.ts', 'config.ts'],
  },
)

// eslint-disable-next-line no-restricted-exports
export default rootEslintConfig
