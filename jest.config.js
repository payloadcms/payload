module.exports = {
  globalSetup: './test/jest.setup.ts',
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/packages/payload/src/bundlers/mocks/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/packages/payload/src/bundlers/mocks/fileMock.js',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/payload/src/**/*.spec.ts', '<rootDir>/test/**/*int.spec.ts'],
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
}

// // NextJS way of doing it
// const path = require('path')

// const nextJest = require('next/jest')

// // Optionally provide path to Next.js app which will enable loading next.config.js and .env files
// const createJestConfig = nextJest({ dir: path.resolve(__dirname, './test/REST_API') })

// // Any custom config you want to pass to Jest
// const customJestConfig = {
//   globalSetup: './test/jest.setup.ts',
//   moduleNameMapper: {
//     '\\.(css|scss)$': '<rootDir>/packages/payload/src/bundlers/mocks/emptyModule.js',
//     '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
//       '<rootDir>/packages/payload/src/bundlers/mocks/fileMock.js',
//   },
//   testEnvironment: 'node',
//   testMatch: ['<rootDir>/packages/payload/src/**/*.spec.ts', '<rootDir>/test/**/*int.spec.ts'],
//   testTimeout: 90000,
//   transform: {
//     '^.+\\.(t|j)sx?$': ['@swc/jest'],
//   },
//   verbose: true,
// }

// // createJestConfig is exported in this way to ensure that next/jest can load the Next.js config which is async
// module.exports = createJestConfig(customJestConfig)
