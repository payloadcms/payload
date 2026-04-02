import { rootEslintConfig, rootParserOptions } from '../../eslint.config.js'

/** @typedef {import('eslint').Linter.Config} Config */


/**
 * We've removed all eslint.config.js from the packages, but we have to leave this one as an exception.
 * The payload package is so large that without its own eslint.config, an M3 Pro (18GB) runs out of
 * memory when linting. Interestingly, two days ago when I started this PR, this didn't happen, but it
 * started happening when I did a merge from main to update the PR.
 * tsc also takes a long time to run. It's likely that at some point we'll need to split the package
 * (into payload1, payload2, etc.) and re-export them in payload.
 */
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
            allowDefaultProject: ['bin.js', 'bundle.js', 'rollup.dts.config.mjs'],
          },
      },
    },
  },
]

export default index
