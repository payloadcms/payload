import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it } from 'vitest'

import { canReuseStoredDefault } from './canReuseStoredDefault.js'

const collection = { slug: 'media', upload: {} } as SanitizedCollectionConfig
const req = { payload: { config: { routes: { api: '/api' } } } } as PayloadRequest
const original = { filename: 'a.png', filesize: 1, url: '/api/media/file/a.png' }

describe('materialized representation ownership', () => {
  it('should reuse a stored default even when the original shares its bytes', () => {
    expect(canReuseStoredDefault({ collection, req, doc: { ...original, original } })).toBe(true)
  })

  it('should require a physical descriptor for a requested variant', () => {
    const doc = {
      ...original,
      original,
      variants: {
        small: {
          filename: 'small.png',
          filesize: null as null | number,
          url: '/api/media/file/small.png',
        },
      },
    }

    expect(canReuseStoredDefault({ collection, req, doc, filename: 'small.png' })).toBe(false)
    doc.variants.small.filesize = 1
    expect(canReuseStoredDefault({ collection, req, doc, filename: 'small.png' })).toBe(true)
  })

  it('should not infer stored bytes from a logical filename and URL', () => {
    expect(
      canReuseStoredDefault({
        collection,
        req,
        doc: {
          filename: 'default.png',
          filesize: null as null | number,
          url: '/api/media/file/default.png',
          original,
        },
      }),
    ).toBe(false)
  })
})
