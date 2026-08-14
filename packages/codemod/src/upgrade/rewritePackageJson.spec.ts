import { describe, expect, it } from 'vitest'

import type { ResolvedVersions } from './types.js'

import { rewritePackageJson } from './rewritePackageJson.js'

const resolved: ResolvedVersions = {
  enginesNode: '>=24.15.0',
  nextTarget: '16.9.3',
  payloadVersion: '4.0.0-canary.20',
  typesNode: '24.12.3',
  typescript: '6.0.3',
}

const baseInput = () => ({
  dependencies: {
    '@payloadcms/next': '^3.0.0',
    '@payloadcms/ui': '~3.0.0',
    next: '15.5.0',
    payload: '^3.0.0',
    react: '19.0.0',
  },
  devDependencies: {
    '@payloadcms/eslint-config': '^3.0.0',
    '@payloadcms/eslint-plugin': '^3.0.0',
    '@types/node': '22.9.0',
    typescript: '5.7.3',
  },
  engines: { node: '>=18.20.2' },
  pnpm: { overrides: { payload: '3.0.0', 'some-other': '1.0.0' } },
  resolutions: { '@payloadcms/ui': '3.0.0' },
})

describe('rewritePackageJson', () => {
  it('pins payload packages exactly, deletes payload overrides, writes floors, leaves next/react', () => {
    const data = baseInput() as Record<string, unknown>

    const summary = rewritePackageJson({ data, resolved })

    expect(data).toEqual({
      dependencies: {
        '@payloadcms/next': '4.0.0-canary.20',
        '@payloadcms/ui': '4.0.0-canary.20',
        next: '15.5.0', // untouched
        payload: '4.0.0-canary.20',
        react: '19.0.0', // untouched
      },
      devDependencies: {
        '@payloadcms/eslint-config': 'latest', // versioned independently
        '@payloadcms/eslint-plugin': 'latest', // versioned independently
        '@types/node': '24.12.3',
        typescript: '6.0.3',
      },
      engines: { node: '>=24.15.0' },
      pnpm: { overrides: { 'some-other': '1.0.0' } }, // payload override removed, unrelated kept
      // resolutions removed entirely (only key was a payload package)
    })
    expect(summary.overridesRemoved.sort()).toEqual(
      ['pnpm.overrides.payload', 'resolutions.@payloadcms/ui'].sort(),
    )
    expect(summary.pinnedPayload).toContain('payload')
    // eslint packages are not lockstep-pinned
    expect(summary.pinnedPayload).not.toContain('@payloadcms/eslint-config')
  })

  it('adds floors to devDependencies when absent', () => {
    const data: Record<string, unknown> = { dependencies: { payload: '^3.0.0' } }

    rewritePackageJson({ data, resolved })

    expect(data.devDependencies).toEqual({
      '@types/node': '24.12.3',
      typescript: '6.0.3',
    })
    expect(data.engines).toEqual({ node: '>=24.15.0' })
  })

  it('is idempotent', () => {
    const data = baseInput() as Record<string, unknown>

    rewritePackageJson({ data, resolved })
    const once = JSON.stringify(data)
    rewritePackageJson({ data, resolved })

    expect(JSON.stringify(data)).toBe(once)
  })
})
