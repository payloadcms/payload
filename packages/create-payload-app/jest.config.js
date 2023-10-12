module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/?(*.)+(spec|test|it-test).[tj]s?(x)'],
  testTimeout: 10000,
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  verbose: true,
}
