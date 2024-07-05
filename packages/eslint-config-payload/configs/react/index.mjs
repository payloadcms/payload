import reactRules from './rules/react.mjs'
import reactA11yRules from './rules/react-a11y.mjs'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import reactHooks from 'eslint-plugin-react-hooks'
import {configs} from 'eslint-plugin-react-hooks'
import globals from "globals";
import { deepMerge } from '../../deepMerge.js'

/** @type {import('eslint').Linter.FlatConfig} */
export const index = deepMerge(
  reactRecommended,
  {
    rules: configs.recommended.rules // Only take rules from the config, not plugins, as plugins there are on the old eslint v8 format => add react-hooks plugin myself below
  },
  reactRules,
  reactA11yRules,
  {
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
  }
)
export default index
