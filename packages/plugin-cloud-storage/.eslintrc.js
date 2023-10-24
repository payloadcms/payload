module.exports = {
  root: true,
  extends: ['./eslint-config'],
  overrides: [
    // Temporary overrides. Re-enable once platform is more mature
    {
      files: ['dev/**/*.ts'],
      rules: {
        'import/no-relative-packages': 'off',
        'no-process-env': 'off',
      },
    },
  ],
}
