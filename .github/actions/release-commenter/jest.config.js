module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['./src/**'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dst/'],
}
