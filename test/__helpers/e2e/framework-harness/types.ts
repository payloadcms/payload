/**
 * Framework-agnostic test harness interface for e2e tests.
 *
 * Each admin adapter (Next.js, TanStack Start, etc.) provides its own
 * harness implementation. Tests select the harness via PAYLOAD_FRAMEWORK
 * env var (defaults to 'next').
 */

export type PayloadTestConfig = {
  /** Test suite name (e.g. 'admin', 'fields') */
  suiteName?: string
  /** Absolute path to the test directory containing config.ts */
  testDir: string
}

export interface FrameworkTestHarness {
  /** Framework identifier */
  readonly name: string
  /** Start the dev server. Returns the server URL. */
  start(config: PayloadTestConfig): Promise<{ adminRoute: string; url: string }>
  /** Stop the dev server */
  stop(): Promise<void>
}
