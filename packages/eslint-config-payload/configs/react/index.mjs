import reactRules from './rules/react.mjs'
import reactA11yRules from './rules/react-a11y.mjs'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import reactHooks from 'eslint-plugin-react-hooks'
import {configs} from 'eslint-plugin-react-hooks'
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig} */
export const index = {
  languageOptions: {
    globals: {
      ...globals.browser,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      }
    }
  },
  plugins: {
    'jsx-a11y': jsxA11y,
    react,
    'react-hooks': reactHooks,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    reactRecommended,
    configs.recommended,
    reactRules,
    reactA11yRules,
  ],
  rules: {},
}

export default index
