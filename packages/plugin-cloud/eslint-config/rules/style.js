module.exports = {
  rules: {
    'prefer-named-exports': 'off',

  'prefer-destructuring': 'off',
    // 'prefer-destructuring': ['warn', { object: true, array: true }],
    // ensure all object/arrays end with a comma
    'comma-dangle': ['error', 'always-multiline'],
    'class-methods-use-this': 'off',
    // consistent new lines
    'function-paren-newline': ['error', 'consistent'],
    'eol-last': ['error', 'always'],
    // allow restricted syntax like for...of loops
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-console': 'error',
    // 'no-floating-promises': true,
    // do not allow process.env access in files
    'no-process-env': 'warn',
  },
}
