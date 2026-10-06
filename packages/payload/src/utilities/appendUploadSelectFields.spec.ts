import type { SanitizedCollectionConfig } from '../collections/config/types.js'

import { appendUploadSelectFields } from './appendUploadSelectFields.js'
import { describe, expect, it } from 'vitest'

describe('appendUploadSelectFields', () => {
  it('should include fields required to render upload thumbnails', () => {
    const select = {}
    const collectionConfig = {
      upload: { imageSizes: [{ name: 'small', width: 100 }] },
    } as SanitizedCollectionConfig

    appendUploadSelectFields({ collectionConfig, select })

    expect(select).toMatchObject({
      filename: true,
      mimeType: true,
      thumbnailURL: true,
      sizes: { small: { filename: true, url: true, width: true } },
    })
  })
})
