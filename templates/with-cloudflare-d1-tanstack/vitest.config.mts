import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'cloudflare:workers': path.resolve('tests/mocks/cloudflare-workers.ts'),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
  },
})
