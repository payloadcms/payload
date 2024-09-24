import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'
import reactCompiler from 'eslint-plugin-react-compiler'
const { rules } = reactCompiler
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
    plugins: {
      'react-compiler': {
        rules,
      },
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]

export default index
