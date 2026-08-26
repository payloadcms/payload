import { describe, expect, it } from 'vitest'

import type { UploadTransformerInternal } from './uploadTransformerBridge.js'

import {
  getUploadTransformerInternal,
  uploadTransformerInternal,
} from './uploadTransformerBridge.js'

describe('getUploadTransformerInternal', () => {
  it('should return the bridge attached under the internal symbol', () => {
    const bridge: UploadTransformerInternal = { prepareUpload: async () => [] }
    const transformer = { [uploadTransformerInternal]: bridge }

    expect(getUploadTransformerInternal(transformer)).toBe(bridge)
  })

  it('should return undefined when the transformer has no bridge attached', () => {
    const transformer = { slug: 'plain-transformer' }

    expect(getUploadTransformerInternal(transformer)).toBeUndefined()
  })

  it('should resolve the symbol by its shared key rather than object identity', () => {
    const bridge: UploadTransformerInternal = { prepareUpload: async () => [] }
    const transformer = { [Symbol.for('payload.uploadTransformerInternal')]: bridge }

    expect(getUploadTransformerInternal(transformer)).toBe(bridge)
  })
})
