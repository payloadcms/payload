import reactRules from './rules/react.mjs'
import reactA11yRules from './rules/react-a11y.mjs'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import eslintPluginReactConfig from 'eslint-plugin-react/configs/recommended.js'
import eslintPluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals';
import { fixupPluginRules } from '@eslint/compat'
import { deepMerge } from '../../deepMerge.js'

/** @type {import('eslint').Linter.FlatConfig} */
export const index = deepMerge(
  {
    rules: eslintPluginReact.configs.recommended.rules
  },
  {
    rules: eslintPluginReactConfig.rules // Only take rules from the config, not plugins, as plugins there are on the old eslint v8 format => add react-hooks plugin myself below
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
      react: fixupPluginRules(eslintPluginReact),
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
