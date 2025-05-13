import lexical from '@lexical/eslint-plugin'
import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [...rootEslintConfig]

export default index
