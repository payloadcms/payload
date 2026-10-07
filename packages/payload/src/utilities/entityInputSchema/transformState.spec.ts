import { describe, expect, it } from 'vitest'

import type { Config } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { sanitizeConfig } from '../../config/sanitize.js'
import { buildTransformStateJSONSchema } from '../../uploads/transformState/buildTransformStateJSONSchema.js'
import { getTransformStateErrors } from '../../uploads/transformState/validateTransformState.js'
import { entityToStandaloneJSONSchema } from '../configToJSONSchema.js'
import { getCollectionInputSchema } from './getEntityInputSchema.js'
import { validateCollectionData } from './validateEntityData.js'

const createRequest = (): PayloadRequest => {
  const config = sanitizeConfig({
    collections: [
      {
        slug: 'media',
        authorship: false,
        timestamps: false,
        versions: false,
        fields: [
          {
            name: '_transforms',
            type: 'json',
            jsonSchema: buildTransformStateJSONSchema({
              transformers: [
                {
                  slug: 'watermark',
                  mimeTypes: ['image/*'],
                  transformDefinitions: {
                    watermark: {
                      type: 'object',
                      description: 'Optional watermark documentation.',
                      properties: {
                        text: { type: 'string', description: 'Visible watermark text.' },
                      },
                      required: ['text'],
                      additionalProperties: false,
                    },
                  },
                },
              ],
            }),
          },
        ],
      },
    ],
  } as Config)

  return {
    payload: {
      collections: { media: { config: config.collections.find(({ slug }) => slug === 'media')! } },
      config,
      db: { defaultIDType: 'text' },
    },
  } as unknown as PayloadRequest
}

describe('transform state input schema parity', () => {
  it.each([false, true])(
    'should leave defined custom shapes to adapters with partial=%s',
    (partial) => {
      const req = createRequest()
      const data = { _transforms: { watermark: 42 } }

      expect(getTransformStateErrors({ value: data._transforms })).toEqual([])
      expect(() => validateCollectionData({ slug: 'media', data, partial, req })).not.toThrow()
    },
  )

  it('should accept undeclared JSON-compatible custom keys', () => {
    const req = createRequest()

    expect(() =>
      validateCollectionData({
        slug: 'media',
        data: { _transforms: { custom: { nested: [null, false, 'value', 3] } } },
        req,
      }),
    ).not.toThrow()
  })

  it.each([false, true])('should reject malformed built-in shapes with partial=%s', (partial) => {
    const req = createRequest()

    expect(() =>
      validateCollectionData({
        slug: 'media',
        data: { _transforms: { crop: { x: -1, y: 0, width: 10, height: 10 } } },
        partial,
        req,
      }),
    ).toThrow(/_transforms.crop.x/)
  })

  it.each([{}, { _transforms: null }, { _transforms: {} }])(
    'should accept omitted, null and empty state: %j',
    (data) => {
      const req = createRequest()

      expect(() => validateCollectionData({ slug: 'media', data, req })).not.toThrow()
    },
  )

  it('should preserve output definitions after generating the input schema', () => {
    const req = createRequest()

    getCollectionInputSchema({ collectionSlug: 'media', req })

    const output = entityToStandaloneJSONSchema({
      config: req.payload.config,
      defaultIDType: 'text',
      entity: req.payload.collections.media!.config,
    })
    const state = output.properties!._transforms
    const object = state.anyOf!.find(({ type }) => type === 'object')!

    expect(object.properties!.watermark).toEqual({
      type: 'object',
      description: 'Optional watermark documentation.',
      properties: { text: { type: 'string', description: 'Visible watermark text.' } },
      required: ['text'],
      additionalProperties: false,
    })
  })
})
