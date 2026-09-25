import { describe, expect, it, vi } from 'vitest'

vi.mock('./sanitize.js', () => ({
  sanitizeConfig: vi.fn((config: unknown) => config),
}))

import type { UploadTransformer } from '../uploads/transformers/types.js'
import type { Config, StorageAdapter } from './types.js'

import { buildConfig } from './build.js'

const makeConfig = (overrides: Partial<Config> = {}): Config =>
  ({
    collections: [],
    secret: 'test',
    ...overrides,
  }) as Config

describe('buildConfig', () => {
  it('should run transformer init between the plugins loop and the storage adapter init loop', async () => {
    const callOrder: string[] = []

    const plugin = vi.fn(async (config: Config) => {
      callOrder.push('plugin')
      return config
    })

    const transformer: UploadTransformer = {
      init: vi.fn(async (config: Config) => {
        callOrder.push('transformer-init')
        return config
      }),
      mimeTypes: ['image/*'],
      slug: 'test-transformer',
    }

    const storageAdapter: StorageAdapter = {
      init: vi.fn(async (config: Config) => {
        callOrder.push('storage-init')
        return config
      }),
    } as unknown as StorageAdapter

    await buildConfig(
      makeConfig({
        plugins: [plugin],
        storage: [storageAdapter],
        upload: { transformers: [transformer] },
      }),
    )

    expect(callOrder).toEqual(['plugin', 'transformer-init', 'storage-init'])
  })

  it('should re-validate transformer slug uniqueness after init mutates the transformers list', async () => {
    const transformerA: UploadTransformer = { mimeTypes: ['image/*'], slug: 'a' }

    const transformerB: UploadTransformer = {
      init: vi.fn((config: Config) => ({
        ...config,
        upload: {
          ...config.upload,
          transformers: [transformerA, { ...transformerA }],
        },
      })),
      mimeTypes: ['image/*'],
      slug: 'b',
    }

    await expect(
      buildConfig(makeConfig({ upload: { transformers: [transformerA, transformerB] } })),
    ).rejects.toThrow(/duplicate/i)
  })

  it('should reject a config still using the removed top-level sharp option', async () => {
    await expect(buildConfig({ ...makeConfig(), sharp: {} } as unknown as Config)).rejects.toThrow(
      /sharp/i,
    )
  })
})
