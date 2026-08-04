import { describe, expect, it } from 'vitest'

import type { NextAppDetails, TanStackAppDetails, TanStackDetectionResult } from './types.js'

import { resolveExistingHost } from './main.js'

describe('resolveExistingHost', () => {
  it('should reject ambiguous recognized hosts before choosing a framework', () => {
    expect(
      resolveExistingHost({
        nextAppDetails: createNextAppDetails({ isPayloadInstalled: true }),
        tanStackDetection: createTanStackDetection({ isPayloadInstalled: true }),
      }),
    ).toEqual({ kind: 'ambiguous' })
  })

  it('should resolve a Next host', () => {
    const nextAppDetails = createNextAppDetails({ isPayloadInstalled: true })

    expect(resolveExistingHost({ nextAppDetails, tanStackDetection: { detected: false } })).toEqual(
      { appDetails: nextAppDetails, kind: 'next' },
    )
  })

  it('should resolve a compatible TanStack host', () => {
    const tanStackDetection = createTanStackDetection({ isPayloadInstalled: false })

    expect(
      resolveExistingHost({ nextAppDetails: createNoNextAppDetails(), tanStackDetection }),
    ).toEqual({ appDetails: tanStackDetection.details, kind: 'tanstack' })
  })

  it('should preserve an incompatible TanStack reason', () => {
    const tanStackDetection: TanStackDetectionResult = {
      compatible: false,
      detected: true,
      reason: 'TanStack Solid projects are not supported.',
    }

    expect(
      resolveExistingHost({ nextAppDetails: createNoNextAppDetails(), tanStackDetection }),
    ).toEqual({ kind: 'unsupported-tanstack', reason: tanStackDetection.reason })
  })

  it('should continue the new-project flow when no host is detected', () => {
    expect(
      resolveExistingHost({
        nextAppDetails: createNoNextAppDetails(),
        tanStackDetection: { detected: false },
      }),
    ).toEqual({ kind: 'none' })
  })
})

function createNextAppDetails({ isPayloadInstalled }: { isPayloadInstalled: boolean }) {
  return {
    ...createNoNextAppDetails(),
    isPayloadInstalled,
    isSupportedNextVersion: true,
    nextConfigPath: '/project/next.config.ts',
    nextVersion: '15.0.0',
  } satisfies NextAppDetails
}

function createNoNextAppDetails(): NextAppDetails {
  return {
    hasTopLevelLayout: false,
    isSrcDir: true,
    isSupportedNextVersion: false,
    nextVersion: null,
  }
}

function createTanStackDetection({
  isPayloadInstalled,
}: {
  isPayloadInstalled: boolean
}): Extract<TanStackDetectionResult, { compatible: true }> {
  const details: TanStackAppDetails = {
    isPayloadInstalled,
    kind: 'start',
    projectDir: '/project',
    rootRoutePath: '/project/src/routes/__root.tsx',
    routerPath: '/project/src/router.tsx',
    routesDir: '/project/src/routes',
    sourceDir: '/project/src',
    viteConfigPath: '/project/vite.config.ts',
  }

  return { compatible: true, details, detected: true }
}
