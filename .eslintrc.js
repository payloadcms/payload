module.exports = {
  root: true,
  extends: ['./eslint-config'],
  overrides: [
    {
      rules: {
        'no-process-env': 'off',
      },
    },
    {
      files: ['dev/**/*.ts'],
      rules: {
        'import/no-relative-packages': 'off',
      },
    },
  ],
}
