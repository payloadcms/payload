/** @type {import('prettier').Config} */
module.exports = {
  extends: ['@payloadcms'],
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: ['*.js', '*.cjs'],
    },
  ],
  root: true,
}
