import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig[]} */
export const index = [
  ...rootEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigDirName: import.meta.dirname,
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
        EXPERIMENTAL_useProjectService: {
          allowDefaultProjectForFiles: ['./*.ts', './*.tsx'],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: Number.MAX_SAFE_INTEGER,
        },
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },
]

export default index
