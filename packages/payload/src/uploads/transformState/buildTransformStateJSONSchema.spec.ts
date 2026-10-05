import { describe, expect, it } from 'vitest'

import { buildTransformStateJSONSchema } from './buildTransformStateJSONSchema.js'
import { transformStateJSONSchema } from './transformStateSchema.js'
import { getTransformStateErrors } from './validateTransformState.js'

const transformer = {
  slug: 'custom',
  mimeTypes: ['image/*'],
  transformDefinitions: {
    watermark: {
      type: 'object' as const,
      description: 'Watermark intent interpreted by this adapter.',
      properties: { text: { type: 'string' as const, description: 'Visible watermark text.' } },
      required: ['text'],
      additionalProperties: false,
    },
  },
}

describe('optional transform definitions', () => {
  it('should add custom properties and descriptions without closing the container or mutating shared schemas', () => {
    const schema = buildTransformStateJSONSchema({ transformers: [transformer] })
    const objectSchema = schema.schema.anyOf!.find((branch) => branch.type === 'object')!

    expect(objectSchema.properties?.watermark).toEqual(transformer.transformDefinitions.watermark)
    expect(objectSchema.properties?.crop).toBeDefined()
    expect(objectSchema.additionalProperties).not.toBe(false)
    expect(JSON.stringify(transformStateJSONSchema)).not.toContain('watermark')
    expect(getTransformStateErrors({ value: { watermark: 42, undeclared: ['anything'] } })).toEqual(
      [],
    )
  })

  it('should reject a definition that attempts to redefine a built-in key', () => {
    expect(() =>
      buildTransformStateJSONSchema({
        transformers: [
          {
            ...transformer,
            transformDefinitions: { crop: { type: 'string' } },
          },
        ],
      }),
    ).toThrow(/crop/)
  })

  it('should reject conflicting custom definitions rather than depend on adapter order', () => {
    expect(() =>
      buildTransformStateJSONSchema({
        transformers: [
          transformer,
          {
            ...transformer,
            slug: 'second',
            transformDefinitions: { watermark: { type: 'string' } },
          },
        ],
      }),
    ).toThrow(/watermark/)
  })

  it('should allow identical custom definitions across adapters', () => {
    expect(
      buildTransformStateJSONSchema({
        transformers: [transformer, { ...transformer, slug: 'second' }],
      }),
    ).toEqual(buildTransformStateJSONSchema({ transformers: [transformer] }))
  })

  it('should work without definitions', () => {
    expect(buildTransformStateJSONSchema({ transformers: [] })).toEqual(transformStateJSONSchema)
  })
})
