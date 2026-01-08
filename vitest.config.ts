import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false, // too troublesome especially with the in memory DB setup
    projects: [
      {
        test: {
          include: ['packages/**/*.spec.ts'],
          name: 'unit',
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: {
            graphql: 'node_modules/graphql/index.js', // https://github.com/vitest-dev/vitest/issues/4605
          },
        },
        test: {
          include: ['test/**/*int.spec.ts'],
          name: 'int',
          environment: 'node',
          fileParallelism: false,
          hookTimeout: 90000,
          testTimeout: 90000,
          setupFiles: ['./test/vitest.setup.ts'],
        },
      },
    ],
  },
})
