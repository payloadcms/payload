module.exports = {
  verbose: true,
  globalSetup: '<rootDir>/src/tests/globalSetup.ts',
  roots: ['<rootDir>/src/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021',
        },
      },
    ],
  },
}
