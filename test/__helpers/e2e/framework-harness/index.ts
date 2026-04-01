import type { FrameworkTestHarness } from './types.js'

import { NextJsTestHarness } from './next.js'

export type { FrameworkTestHarness, PayloadTestConfig } from './types.js'

const SUPPORTED_FRAMEWORKS = ['next', 'tanstack-start'] as const
export type SupportedFramework = (typeof SUPPORTED_FRAMEWORKS)[number]

/**
 * Returns the test harness for the current framework.
 *
 * Framework is selected via PAYLOAD_FRAMEWORK env var (defaults to 'next').
 *
 * @example
 * ```ts
 * // In playwright.config.ts or globalSetup.ts:
 * const harness = getTestHarness()
 * const { url } = await harness.start({ testDir, suiteName })
 * ```
 */
export function getTestHarness(): FrameworkTestHarness {
  const framework = (process.env.PAYLOAD_FRAMEWORK ?? 'next') as SupportedFramework

  switch (framework) {
    case 'next':
      return new NextJsTestHarness()
    case 'tanstack-start':
      throw new Error(
        'TanStack Start test harness is not yet implemented. ' +
          'Implement a TanStackStartTestHarness class following the FrameworkTestHarness interface.',
      )
    default: {
      const exhaustive: never = framework
      throw new Error(
        `Unknown PAYLOAD_FRAMEWORK: "${exhaustive}". Valid values: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
      )
    }
  }
}
