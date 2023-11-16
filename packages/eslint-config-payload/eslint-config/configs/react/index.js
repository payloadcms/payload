module.exports = {
  env: {
    browser: true,
  },
  plugins: ['jsx-a11y', 'react-hooks', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: ['./rules/react-a11y.js', './rules/react.js'].map(require.resolve),
  rules: {},
}
