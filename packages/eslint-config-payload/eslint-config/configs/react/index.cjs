module.exports = {
  env: {
    browser: true,
  },
  plugins: [
    'jsx-a11y',
    'react-hooks',
    'react',
  ],
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
  extends: [
    './rules/react-a11y.cjs',
    './rules/react.cjs',
  ].map(require.resolve),
  rules: {},
};
