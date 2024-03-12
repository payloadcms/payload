/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ['payload-types.ts'],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
}
