import jestRules from './rules/jest.mjs'
import jestDomRules from './rules/jest-dom.mjs'
import jestDom from 'eslint-plugin-jest-dom'
import jest from 'eslint-plugin-jest'


/** @type {import('eslint').Linter.FlatConfig} */
export const index = {
  env: {
    jest: true,
  },
  plugins: {
    jest,
    'jest-dom': jestDom,
  },
  extends: [
    jestRules,
    jestDomRules,
  ],
  rules: {},
}

export default index
