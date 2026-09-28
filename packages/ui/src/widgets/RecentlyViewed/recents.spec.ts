import type { Field } from 'payload'

import { describe, expect, it } from 'vitest'

import { getThumbnailURL, togglePinnedItem } from './recents.js'

describe('recents and pinned', () => {
  it('should add and remove the same document without affecting another collection', () => {
    const item = { collectionSlug: 'posts', id: 1 }
    const other = { collectionSlug: 'pages', id: 1 }
    const pinned = togglePinnedItem({ existing: [other], item })

    expect(pinned).toEqual([item, other])
    expect(togglePinnedItem({ existing: pinned, item })).toEqual([other])
  })

  it('should use the configured upload field, then the first upload field', () => {
    const doc = {
      cover: { thumbnailURL: '/cover.jpg' },
      hero: { url: '/hero.jpg' },
    }
    const fields: Field[] = [
      { name: 'hero', type: 'upload' },
      { name: 'cover', type: 'upload' },
    ]

    expect(getThumbnailURL({ doc, fields, isUploadCollection: false })).toBe('/hero.jpg')
    expect(
      getThumbnailURL({ doc, fields, isUploadCollection: false, useAsThumbnail: 'cover' }),
    ).toBe('/cover.jpg')
    expect(getThumbnailURL({ doc: {}, fields, isUploadCollection: false })).toBeUndefined()
    expect(
      getThumbnailURL({
        doc: { media: { image: { url: '/nested.jpg' } } },
        fields: [
          {
            name: 'media',
            type: 'group',
            fields: [{ name: 'image', type: 'upload', relationTo: 'uploads' }],
          },
        ],
        isUploadCollection: false,
      }),
    ).toBe('/nested.jpg')
    expect(getThumbnailURL({ doc: { url: '/upload.jpg' }, fields, isUploadCollection: true })).toBe(
      '/upload.jpg',
    )
  })
})
