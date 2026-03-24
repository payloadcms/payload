/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ['src/postgres/predefinedMigrations/v2-v3/index.ts'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
