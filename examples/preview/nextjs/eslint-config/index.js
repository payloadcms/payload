module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-base',
    'plugin:@next/next/recommended',
    require.resolve('./rules/typescript.js'),
    require.resolve('./rules/import.js'),
    require.resolve('./rules/prettier.js'),
    require.resolve('./rules/style.js'),
    require.resolve('./rules/react.js'),
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  globals: {
    NodeJS: true,
  },
}
