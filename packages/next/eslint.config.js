import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const index = [
  ...rootEslintConfig,
  {
    ignores: ['README.md', 'packages/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
      },
    },
    settings: {
      next: {
        rootDir: '../../app/',
      },
    },
  },
]

export default index
