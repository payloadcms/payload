import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export const index = [
  ...rootEslintConfig,
  {
    settings: {
      next: {
        rootDir: '../../app/',
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        ...rootParserOptions,
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          // See comment in packages/eslint-config/index.mjs
          allowDefaultProject: [
            'bundleScss.js',
            'bundle.js',
            'babel.config.cjs',
            'bundleWithPayload.js',
            'createStubScss.js',
          ],
        },
      },
    },
  },
]

export default index
