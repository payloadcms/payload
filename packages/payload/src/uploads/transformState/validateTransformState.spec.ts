import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { getTransformDefinitionError } from './validateTransformState.js'

describe('getTransformDefinitionError', () => {
  it('should not validate a declared key that the value only inherits, such as toString', async () => {
    const validate = vi.fn(() => 'toString: not allowed')
    const req = {
      payload: {
        config: {
          upload: { transformers: [{ transformDefinitions: [{ key: 'toString', validate }] }] },
        },
      },
    } as unknown as PayloadRequest

    const error = await getTransformDefinitionError({
      collectionSlug: 'media',
      doc: {},
      originalDoc: {},
      req,
      transforms: { watermark: { text: 'draft' } },
    })

    expect(error).toBeUndefined()
    expect(validate).not.toHaveBeenCalled()
  })
})
