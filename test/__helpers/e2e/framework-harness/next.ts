/**
 * Next.js framework test harness.
 *
 * Wraps the existing Next.js dev-server behavior (getNextRootDir + devServer)
 * behind the FrameworkTestHarness interface so e2e tests can be written
 * framework-agnostically.
 */

import path from 'path'

import type { FrameworkTestHarness, PayloadTestConfig } from './types.js'

import { getNextRootDir } from '../shared/getNextRootDir.js'

export class NextJsTestHarness implements FrameworkTestHarness {
  readonly name = 'next'

  start(config: PayloadTestConfig): Promise<{ adminRoute: string; url: string }> {
    const { rootDir, adminRoute } = getNextRootDir(config.suiteName)

    // The Next.js dev server is started by Playwright's globalSetup (not here).
    // This method returns the metadata the harness provides to test files.
    const port = process.env.PORT ?? '3000'
    const url = `http://localhost:${port}`

    return Promise.resolve({ adminRoute, url })
  }

  stop(): Promise<void> {
    // Next.js dev server teardown is handled by Playwright's globalTeardown.
    return Promise.resolve()
  }
}
