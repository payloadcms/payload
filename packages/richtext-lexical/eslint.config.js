import lexical from '@lexical/eslint-plugin'
import { rootEslintConfig } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const index = [
  ...rootEslintConfig,
  {
    ignores: ['README.md', 'packages/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigDirName: import.meta.dirname,
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
        EXPERIMENTAL_useProjectService: true,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@lexical': lexical,
    },
    rules: lexical.configs.recommended.rules,
  },
]

export default index
