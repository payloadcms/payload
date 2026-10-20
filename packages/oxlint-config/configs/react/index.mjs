import reactRules from './rules/react.mjs'
import reactA11yRules from './rules/react-a11y.mjs'
import react from '@eslint-react/eslint-plugin'

/** @type {Omit<import('oxlint').OxlintOverride, 'files'>} */
export const index = {
  env: {
    browser: true,
  },
  rules: {
    ...react.configs['recommended-type-checked'].rules,
    // `eslint-plugin-react-hooks`'s recommended rules, which oxlint has built in
    'react-hooks/exhaustive-deps': 'warn',
    // TODO: back to 'error' once fixed. This version flags more than the ESLint one.
    'react-hooks/rules-of-hooks': 'warn',
    '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
    '@eslint-react/naming-convention/use-state': 'off',
    ...reactRules,
    ...reactA11yRules,
    // Needs type information, which oxlint doesn't give JS plugins
    '@eslint-react/no-leaked-conditional-rendering': 'off',
  },
}
export default index
