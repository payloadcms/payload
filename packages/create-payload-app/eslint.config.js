import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const index = [
  ...rootEslintConfig,
  {
    ignores: ['bin/cli.js'],
    languageOptions: {
      parserOptions: {
        ...rootParserOptions,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]

export default index
