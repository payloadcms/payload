module.exports = {
  parser: "babel-eslint",
  extends: "@trbl",
  rules: {
    "import/no-unresolved": [
      2,
      {
        ignore: [
          'payload/config',
          'payload/unsanitizedConfig',
        ]
      }
    ],
    'no-underscore-dangle': 'off',
  },
};
