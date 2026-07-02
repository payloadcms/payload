import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('json-schema-to-zod', () => ({
  jsonSchemaToZod: () => {
    throw new Error('schema too complex')
  },
}))

describe('convertCollectionSchemaToZod', () => {
  it('returns a schema that supports partial() when conversion fails', async () => {
    const { convertCollectionSchemaToZod } = await import('./convertCollectionSchemaToZod.js')

    const converted = convertCollectionSchemaToZod({
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
      required: ['title'],
    })

    expect(() => converted.partial().shape).not.toThrow()
    expect(converted.partial()).toBeInstanceOf(z.ZodObject)
  })
})
