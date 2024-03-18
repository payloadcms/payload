/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ['src/all', 'writeTranslationFiles.ts'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
}
