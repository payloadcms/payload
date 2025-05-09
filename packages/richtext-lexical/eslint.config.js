import lexical from '@lexical/eslint-plugin'
import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [
  ...rootEslintConfig,
  {
    ignores: ['bundle.js'],
    languageOptions: {
      parserOptions: {
        ...rootParserOptions,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@lexical': lexical,
    },
    rules: lexical.configs.recommended.rules,
  },
]

export default index
