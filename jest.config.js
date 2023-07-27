export default {
  verbose: true,
  testEnvironment: 'node',
  testMatch: [
    '**/src/**/*.spec.ts',
    '**/src/**/*.spec.tsx',
    '**/test/**/*int.spec.ts',
    '**/test/**/*int.spec.tsx',
  ],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  globalSetup: './test/jest.setup.ts',
  extensionsToTreatAsEsm: [".ts", ".tsx"], // <--- this one
  testTimeout: 90000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/bundlers/mocks/fileMock.js',
    '\\.(css|scss)$': '<rootDir>/src/bundlers/mocks/emptyModule.js',
  },
};
