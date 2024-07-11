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
  },
]

export default index
