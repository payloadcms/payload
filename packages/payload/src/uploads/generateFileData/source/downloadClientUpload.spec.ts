import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { UploadTransformer } from '../../transformers/types.js'
import type { PlannedHookOwner } from '../../transformState/planUpload.js'
import type { UploadStages } from '../plan/planUploadStages.js'

import { describe, expect, it } from 'vitest'

import { needsFullClientUpload } from './downloadClientUpload.js'

const probedClientUpload = {
  name: 'clip.mp4',
  data: Buffer.alloc(0),
  mimetype: 'video/mp4',
  size: 1000,
  uploadReference: { filename: 'clip.mp4' },
} as unknown as NonNullable<PayloadRequest['file']>

const posterTransformer: UploadTransformer = {
  slug: 'poster',
  mimeTypes: ['video/mp4'],
  transformVariant: () => Promise.resolve({ status: 'skip' }),
}

const getStages = ({ hookOwners }: { hookOwners: PlannedHookOwner[] }) =>
  ({
    bridgeTransformer: undefined,
    hookOwners,
    pipeline: [],
    plan: {
      claims: new Map(),
      hookOwners,
      mimeType: 'video/mp4',
      options: new Map(),
      pipeline: [],
    },
  }) as Pick<UploadStages, 'bridgeTransformer' | 'hookOwners' | 'pipeline' | 'plan'>

const collection = {
  slug: 'media',
  upload: { disableLocalStorage: true },
} as unknown as SanitizedCollectionConfig

describe('needsFullClientUpload', () => {
  it('should not download a client upload when nothing reads its bytes', () => {
    expect(
      needsFullClientUpload({
        collection,
        file: probedClientUpload,
        pipelineDoc: {},
        stages: getStages({ hookOwners: [] }),
      }),
    ).toBe(false)
  })

  it('should download a client upload when a hook owner is planned for it', () => {
    expect(
      needsFullClientUpload({
        collection,
        file: probedClientUpload,
        pipelineDoc: {},
        stages: getStages({
          hookOwners: [
            {
              options: undefined,
              owner: { slug: 'poster', mimeTypes: ['video/mp4'], variantNames: ['thumbnail'] },
              transformer: posterTransformer as PlannedHookOwner['transformer'],
            },
          ],
        }),
      }),
    ).toBe(true)
  })
})
