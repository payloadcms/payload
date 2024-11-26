import jestRules from './rules/jest.mjs'
import jestDomRules from './rules/jest-dom.mjs'
import jestDom from 'eslint-plugin-jest-dom'
import jest from 'eslint-plugin-jest'
import { deepMerge } from '../../deepMerge.js'

/** @type {import('eslint').Linter.Config} */
export const index = deepMerge(
  {
    rules: jestRules,
  },
  {
    rules: jestDomRules,
  },
  {
    plugins: {
      jest,
      'jest-dom': jestDom,
    },
  },
)

export default index
