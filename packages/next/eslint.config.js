import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [
  ...rootEslintConfig,
  {
    settings: {
      next: {
        rootDir: '../../app/',
      },
    },
  },
]

export default index
