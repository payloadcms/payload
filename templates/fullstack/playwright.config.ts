import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.resolve(__dirname, '.env'))
  } catch {}
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: process.env.PORT ? `pnpm dev -p ${process.env.PORT}` : 'pnpm dev',
    reuseExistingServer: true,
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    timeout: 120 * 1000,
  },
})
