import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from '@payloadcms/eslint-plugin'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
  'packages/**/*.spec.ts',
  'next-env.d.ts',
  '**/app',
  'src/**/*.spec.ts',
  '**/jest.setup.js',
  'packages/payload/rollup.dts.config.mjs',
  'storybook-static/',
]

/** @typedef {import('eslint').Linter.Config} Config */

export const rootParserOptions = {
  sourceType: 'module',
  ecmaVersion: 'latest',
  projectService: true,
}

/** @type {Config[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [
      ...defaultESLintIgnores,
      'packages/eslint-*/**',
      'test/live-preview/next-app',
      'packages/**/*.spec.ts',
      'templates/**',
      'examples/**',
    ],
  },
  {
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      'payload/no-imports-from-exports-dir': 'error',
      'payload/no-imports-from-self': 'error',
      'payload/proper-payload-logger-usage': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['tools/**/*.ts'],
    rules: {
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'payload/no-relative-monorepo-imports': 'off',
    },
  },
]

export default [
  ...rootEslintConfig,
  {
    files: ['packages/eslint-config/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['templates/vercel-postgres/**'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
  {
    files: ['stories/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'payload/no-relative-monorepo-imports': 'off',
      'payload/no-imports-from-exports-dir': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-restricted-exports': 'off', // Allow default exports in Storybook
      'no-console': 'off', // Allow console.log in stories for interactivity
      'react-hooks/rules-of-hooks': 'off', // Allow hooks in story render functions
      'jsx-a11y/accessible-emoji': 'off', // Allow emojis in stories without accessibility wrapping
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      '@eslint-react/dom/no-missing-button-type': 'off',
    },
  },
]
