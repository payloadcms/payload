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

  it('should call every transformer init in declaration order', async () => {
    const callOrder: string[] = []

    const first: UploadTransformer = {
      init: vi.fn(async (config: Config) => {
        callOrder.push('first')
        return config
      }),
      mimeTypes: ['image/*'],
      slug: 'first',
    }

    const second: UploadTransformer = {
      init: vi.fn(async (config: Config) => {
        callOrder.push('second')
        return config
      }),
      mimeTypes: ['image/*'],
      slug: 'second',
    }

    await buildConfig(makeConfig({ upload: { transformers: [first, second] } }))

    expect(callOrder).toEqual(['first', 'second'])
  })

  it('should support a synchronous (non-Promise) transformer init', async () => {
    const init = vi.fn((config: Config) => config)
    const transformer: UploadTransformer = { init, mimeTypes: ['image/*'], slug: 'sync' }

    await expect(
      buildConfig(makeConfig({ upload: { transformers: [transformer] } })),
    ).resolves.toBeDefined()

    expect(init).toHaveBeenCalledTimes(1)
  })

  it('should skip transformers without an init function without throwing', async () => {
    const transformer: UploadTransformer = { mimeTypes: ['image/*'], slug: 'no-init' }

    await expect(
      buildConfig(makeConfig({ upload: { transformers: [transformer] } })),
    ).resolves.toBeDefined()
  })

  it('should reject a config whose original transformers list has duplicate slugs before init runs', async () => {
    const transformers: UploadTransformer[] = [
      { mimeTypes: ['image/*'], slug: 'dup' },
      { mimeTypes: ['image/*'], slug: 'dup' },
    ]

    await expect(buildConfig(makeConfig({ upload: { transformers } }))).rejects.toThrow(/dup/i)
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

  it('should still throw the existing error for a storage entry with no init function', async () => {
    await expect(
      buildConfig(makeConfig({ storage: [{} as unknown as StorageAdapter] })),
    ).rejects.toThrow(/storage/i)
  })
})
