import type { SanitizedCollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'
import { getDocumentThumbnail } from './getDocumentThumbnail.js'

const image = { mimeType: 'image/png', url: '/photo.png', thumbnailURL: '/thumb.png' }
const collection = {
  admin: {},
  fields: [{ type: 'upload', name: 'cover', relationTo: 'media' }],
} as SanitizedCollectionConfig

describe('dashboard thumbnails', () => {
  it('should prefer the generated thumbnail for an upload collection', () => {
    expect(getDocumentThumbnail({ collection: { ...collection, upload: {} }, doc: image })).toBe(
      '/thumb.png',
    )
  })
  it('should infer the first populated upload field', () => {
    expect(getDocumentThumbnail({ collection, doc: { cover: image } })).toBe('/thumb.png')
  })
  it('should resolve a configured nested polymorphic upload', () => {
    expect(
      getDocumentThumbnail({
        collection: { ...collection, admin: { useAsThumbnail: 'hero.image' } },
        doc: {
          hero: { image: { relationTo: 'media', value: image } },
          cover: { url: '/wrong.png', mimeType: 'image/png' },
        },
      }),
    ).toBe('/thumb.png')
  })
  it('should infer uploads in named tabs and arrays', () => {
    const nested = {
      ...collection,
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'hero',
              fields: [{ name: 'slides', type: 'array', fields: collection.fields }],
            },
          ],
        },
      ],
    } as SanitizedCollectionConfig
    expect(
      getDocumentThumbnail({ collection: nested, doc: { hero: { slides: [{ cover: image }] } } }),
    ).toBe('/thumb.png')
  })
  it.each([undefined, 123, [], { mimeType: 'application/pdf', url: '/private.pdf' }])(
    'should fall back to a file icon for missing or non-image media (%s)',
    (cover) => {
      expect(getDocumentThumbnail({ collection, doc: { cover } })).toBeUndefined()
    },
  )
})
