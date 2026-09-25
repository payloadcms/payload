import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { getBaseUploadFields } from './getBaseFields.js'

describe('getBaseUploadFields', () => {
  const fields = getBaseUploadFields({
    collection: { fields: [], slug: 'media', upload: true } as CollectionConfig,
    config: {} as Config,
  })

  it('should expose source metadata as an original group', () => {
    const original = fields.find((field) => 'name' in field && field.name === 'original')

    expect(original).toMatchObject({
      name: 'original',
      type: 'group',
      fields: [
        { name: 'filename', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'mimeType', type: 'text' },
        { name: 'filesize', type: 'number' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
    })
  })

  it('should persist the managed file manifest as a hidden JSON field', () => {
    const manifest = fields.find((field) => 'name' in field && field.name === '_managedFiles')

    expect(manifest).toMatchObject({
      hidden: true,
      name: '_managedFiles',
      type: 'json',
      jsonSchema: { schema: { type: 'array' } },
    })
  })
})
