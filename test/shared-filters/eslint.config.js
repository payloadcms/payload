import { rootParserOptions } from '../../eslint.config.js'
import { testEslintConfig } from '../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [
  ...testEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['./*.ts', './*.tsx'],
          defaultProject: './tsconfig.json',
        },
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
      },
    },
  },
]

export default index
