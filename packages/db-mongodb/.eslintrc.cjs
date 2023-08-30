/** @type {import('prettier').Config} */
module.exports = {
  extends: ['@payloadcms'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  root: true,
}
