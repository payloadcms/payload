import type { SanitizedCollectionConfig } from '../collections/config/types.js'

import { describe, expect, it } from 'vitest'

import { getReferencedUploadFilenames } from './getReferencedUploadFilenames.js'

describe('getReferencedUploadFilenames', () => {
  it('should collect base files and image sizes without unrelated properties', () => {
    const filenames = getReferencedUploadFilenames({
      collectionConfig: { flattenedFields: [] } as unknown as SanitizedCollectionConfig,
      doc: {
        filename: 'image.png',
        sizes: { small: { filename: 'image-small.png' } },
        metadata: { filename: 'unrelated.png' },
      },
    })

    expect([...filenames]).toEqual(['image.png', 'image-small.png'])
  })

  it('should collect only the retained locales of localized upload properties', () => {
    const filenames = getReferencedUploadFilenames({
      collectionConfig: {
        flattenedFields: [
          { name: 'filename', type: 'text', localized: true },
          { name: 'sizes', type: 'group', localized: true },
        ],
      } as unknown as SanitizedCollectionConfig,
      doc: {
        filename: { en: 'pending.png', fr: 'live.png' },
        sizes: {
          en: { small: { filename: 'pending-small.png' } },
          fr: { small: { filename: 'live-small.png' } },
        },
      },
      localeCodes: ['fr'],
    })

    expect([...filenames]).toEqual(['live.png', 'live-small.png'])
  })
})
