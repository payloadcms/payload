module.exports = {
  extends: ['@payloadcms'],
  overrides: [
    {
      files: ['**/*.spec.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
}
