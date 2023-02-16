module.exports = {
  plugins: ['filenames'],
  rules: {
    'filenames/match-regex': ['error', '^[a-z0-9-.]+$', true],
  },
}
