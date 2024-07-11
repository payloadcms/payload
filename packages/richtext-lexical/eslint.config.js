import lexical from '@lexical/eslint-plugin'
import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const index = [
  ...rootEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['./src/*.ts', './src/*.tsx'],
          defaultProject: './tsconfig.json',
        },
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
      },
    },
    plugins: {
      '@lexical': lexical,
    },
    rules: lexical.configs.recommended.rules,
  },
]

export default index
