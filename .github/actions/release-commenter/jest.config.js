module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
}
