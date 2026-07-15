import { describe, expect, it } from 'vitest'

import type { ClientCollectionConfig } from '../index.js'

import { appendUploadSelectFields } from './appendUploadSelectFields.js'

describe('appendUploadSelectFields', () => {
  it('includes size url when adminThumbnail is a string size name', () => {
    const collectionConfig = {
      slug: 'media',
      upload: {
        adminThumbnail: 'thumbnail',
        imageSizes: [
          {
            name: 'thumbnail',
            width: 400,
            height: 300,
          },
        ],
      },
    } as ClientCollectionConfig

    const select = {}
    appendUploadSelectFields({ collectionConfig, select })

    expect(select).toEqual({
      mimeType: true,
      thumbnailURL: true,
      sizes: {
        thumbnail: {
          filename: true,
          url: true,
        },
      },
    })
  })
})
