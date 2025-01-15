import { configDefaults, defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 20_000,
    // setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'src/app/**/*'],
    include: ['**/*.spec.ts'],
  },
})
