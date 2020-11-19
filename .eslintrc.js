module.exports = {
  parser: 'babel-eslint',
  extends: '@trbl',
  ignorePatterns: [
    '/**/*.d.ts'
  ],
  rules: {
    'import/no-unresolved': [
      2,
      {
        ignore: [
          'payload/config',
          'payload/unsanitizedConfig',
        ],
      },
    ],
    'no-underscore-dangle': 'off',
  },
};
