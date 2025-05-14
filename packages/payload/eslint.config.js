import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */


/** @type {Config[]} */
export const index = [
  ...rootEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        ...rootParserOptions,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
  // TODO: This is a good rule, but it has been temporarily disabled
  // until the migration to ts-strict is complete for this package 
  // because `typescript-strict-plugin` causes this rule to conflict with tsc.
  '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  }
]

export default index
