import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { copyUploadFilesToBranch } from './copyUploadFilesToBranch.js'

describe('copyUploadFilesToBranch', () => {
  it('should check cloud filename collisions against the persisted document prefix', async () => {
    const copy = vi.fn(async ({ to, trackStagedObject }) => {
      trackStagedObject({ key: to, remove: vi.fn() })
    })
    const findOne = vi.fn(async ({ where }) => {
      const query = JSON.stringify(where)
      const isFirstBranchFilename = query.includes('"equals":"hero-work.png"')
      const hasPersistedPrefix = query.includes('"prefix":{"equals":"campaign"}')

      return isFirstBranchFilename && hasPersistedPrefix ? { id: 'existing-media' } : null
    })
    const updateOne = vi.fn(async ({ data }) => ({ id: 'shadow-id', ...data }))
    const collection = {
      fields: [{ name: 'prefix', type: 'text' }],
      flattenedFields: [{ name: 'prefix', type: 'text' }],
      slug: 'media',
      upload: {
        fileOperations: {
          copy,
          delete: vi.fn(),
          resolveStorageKey: ({ _objectKey, filename, prefix }) =>
            ['cloud-media', prefix, _objectKey, filename].filter(Boolean).join('/'),
          stage: vi.fn(),
        },
      },
    } as unknown as SanitizedCollectionConfig
    const req = {
      context: {},
      payload: {
        collections: { media: { config: collection } },
        config: { routes: { api: '/api' }, serverURL: '' },
        db: { findOne, updateOne },
        logger: { error: vi.fn() },
      },
    } as unknown as PayloadRequest
    const doc = {
      _objectKey: 'object-1',
      filename: 'hero.png',
      filesize: 100,
      id: 'shadow-id',
      mimeType: 'image/png',
      original: {
        _objectKey: 'object-1',
        filename: 'hero.png',
        filesize: 100,
        mimeType: 'image/png',
        prefix: 'campaign',
        url: '/hero.png',
      },
      prefix: 'campaign',
      url: '/hero.png',
    }

    await copyUploadFilesToBranch({ branch: 'work', collection, doc, req })

    expect(copy).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'cloud-media/campaign/object-1/hero.png',
        to: 'cloud-media/campaign/object-1/hero-work-1.png',
      }),
    )
    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ filename: 'hero-work-1.png' }),
      }),
    )
  })
})
