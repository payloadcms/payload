import { rootParserOptions } from '../../eslint.config.js'
import testEslintConfig from '../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [
  ...testEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        ...rootParserOptions,
      },
    },
  },
]

export default index
