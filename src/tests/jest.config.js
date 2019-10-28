module.exports = {
  verbose: true,
  testURL: 'http://localhost/',
  roots: [
    './unit'
  ],
  transform: {
    '^.+\\.(j|t)s$': 'babel-jest'
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js']
};
