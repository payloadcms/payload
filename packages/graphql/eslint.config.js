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
        projectService: {
          // See comment in packages/eslint-config/index.mjs
          allowDefaultProject: ['bin.js'],
        },
      },
    },
  },
]

export default index
