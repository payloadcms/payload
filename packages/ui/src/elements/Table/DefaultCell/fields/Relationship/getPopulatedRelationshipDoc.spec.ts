import type { ClientCollectionConfig, UploadFieldClient } from 'payload'

import { describe, expect, it } from 'vitest'

import { getPopulatedRelationshipDoc } from './getPopulatedRelationshipDoc.js'

const collectionConfig = {
  admin: { useAsTitle: 'filename' },
  upload: {},
} as ClientCollectionConfig
const field = { name: 'cover', relationTo: 'media', type: 'upload' } as UploadFieldClient

describe('getPopulatedRelationshipDoc', () => {
  it('should leave partially populated upload previews to the relationship provider', () => {
    expect(
      getPopulatedRelationshipDoc({
        collectionConfig,
        doc: { id: 'media-id', filename: 'image.jpg' },
        field,
      }),
    ).toBeUndefined()
  })

  it('should use populated documents with title and preview metadata', () => {
    const doc = {
      id: 'media-id',
      filename: 'image.jpg',
      mimeType: 'image/jpeg',
      url: '/image.jpg',
    }

    expect(getPopulatedRelationshipDoc({ collectionConfig, doc, field })).toBe(doc)
  })

  it('should leave missing titles to the relationship provider', () => {
    expect(
      getPopulatedRelationshipDoc({
        collectionConfig,
        doc: { id: 'media-id', mimeType: 'image/jpeg', url: '/image.jpg' },
        field,
      }),
    ).toBeUndefined()
  })

  it('should use title data without preview metadata when the field disables previews', () => {
    const doc = { id: 'media-id', filename: 'image.jpg' }

    expect(
      getPopulatedRelationshipDoc({
        collectionConfig,
        doc,
        field: { ...field, displayPreview: false },
      }),
    ).toBe(doc)
  })

  it('should use title data without preview metadata when the collection disables previews', () => {
    const doc = { id: 'media-id', filename: 'image.jpg' }

    expect(
      getPopulatedRelationshipDoc({
        collectionConfig: { ...collectionConfig, upload: { displayPreview: false } },
        doc,
        field,
      }),
    ).toBe(doc)
  })
})
