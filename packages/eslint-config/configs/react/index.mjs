import reactRules from './rules/react.mjs'
import reactA11yRules from './rules/react-a11y.mjs'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import { deepMerge } from '../../deepMerge.js'

/** @type {import('eslint').Linter.FlatConfig} */
export const index = deepMerge(
  react.configs['recommended-type-checked'],
  {
    rules: reactHooks.configs.recommended.rules,
  },
  {
    rules: reactRules,
  },
  {
    rules: reactA11yRules,
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
    },
  },
)
export default index
