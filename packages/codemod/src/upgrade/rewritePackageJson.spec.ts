import { describe, expect, it } from 'vitest'

import type { ResolvedVersions } from '../upgrade-shared/toolchain.js'

import { writeFloors } from '../upgrade-shared/toolchain.js'

const resolved: ResolvedVersions = {
  enginesNode: '^24.22.3 || >=26.13.1',
  nextTarget: '16.9.3',
  payloadVersion: '4.0.0-canary.20',
  typesNode: '24.12.3',
  typescript: '6.0.3',
}

describe('writeFloors', () => {
  it('adds floors to devDependencies when absent', () => {
    const data: Record<string, unknown> = { dependencies: { payload: '^3.0.0' } }

    writeFloors({ data, resolved })

    expect(data.devDependencies).toEqual({
      '@types/node': '24.12.3',
      typescript: '6.0.3',
    })
    expect(data.engines).toEqual({ node: '^24.22.3 || >=26.13.1' })
  })

  it('keeps toolchain versions already at or above the floor', () => {
    const data: Record<string, unknown> = {
      devDependencies: { '@types/node': '^24.12.3', typescript: '^6.2.0' },
      engines: { node: '>=26.13.1' },
    }

    const written = writeFloors({ data, resolved })

    expect(data.devDependencies).toEqual({ '@types/node': '^24.12.3', typescript: '^6.2.0' })
    expect(data.engines).toEqual({ node: '>=26.13.1' })
    expect(written).toEqual([])
  })

  it('leaves placeholder and non-semver toolchain specs untouched', () => {
    const data: Record<string, unknown> = {
      devDependencies: { '@types/node': 'latest', typescript: 'catalog:' },
    }

    const written = writeFloors({ data, resolved })

    expect(data.devDependencies).toEqual({ '@types/node': 'latest', typescript: 'catalog:' })
    expect(written).toEqual(['engines.node'])
  })
})
