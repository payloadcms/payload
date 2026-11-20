import type { SanitizedCollectionConfig } from '../collections/config/types.js'

import { appendUploadSelectFields } from './appendUploadSelectFields.js'
import { describe, expect, it } from 'vitest'

describe('appendUploadSelectFields', () => {
  it('should include fields required to render upload thumbnails', () => {
    const select = {}
    const collectionConfig = {
      upload: { variants: [{ name: 'small', width: 100 }] },
    } as SanitizedCollectionConfig

    appendUploadSelectFields({ collectionConfig, select })

    expect(select).toMatchObject({
      filename: true,
      mimeType: true,
      thumbnailURL: true,
      url: true,
      variants: { small: { filename: true, url: true, width: true } },
    })
  })

  it('should include the url for video frames when an admin thumbnail variant is set', () => {
    const select = {}
    const collectionConfig = {
      upload: { adminThumbnail: 'small', variants: [{ name: 'small', width: 100 }] },
    } as SanitizedCollectionConfig

    appendUploadSelectFields({ collectionConfig, select })

    expect(select).toMatchObject({ url: true, variants: { small: { filename: true } } })
  })
})
