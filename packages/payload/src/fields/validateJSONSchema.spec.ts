import type { JSONSchema4 } from 'json-schema'

import { validateJSONSchema } from './validateJSONSchema.js'
import { afterEach, describe, expect, it, vitest } from 'vitest'

const customerSchema: JSONSchema4 = {
  type: 'object',
  properties: {
    a: {
      type: 'number',
    },
  },
  required: ['a'],
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  })

describe('validateJSONSchema', () => {
  afterEach(() => {
    vitest.unstubAllGlobals()
  })

  it('rejects a value that violates an inline schema without fetching', async () => {
    const fetchMock = vitest.fn()
    vitest.stubGlobal('fetch', fetchMock)

    const result = await validateJSONSchema({
      jsonSchema: {
        fileMatch: ['a://b/foo.json'],
        schema: customerSchema,
        uri: 'a://b/foo.json',
      },
      value: { a: 'x' },
    })

    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches a remote schema from uri and rejects a value that violates it', async () => {
    const fetchMock = vitest.fn(async () => jsonResponse(customerSchema))
    vitest.stubGlobal('fetch', fetchMock)

    const jsonSchema: {
      fileMatch: string[]
      schema?: JSONSchema4
      uri: string
    } = {
      fileMatch: ['https://example.com/customer.schema.json'],
      uri: 'https://example.com/customer.schema.json',
    }

    const invalid = await validateJSONSchema({
      jsonSchema,
      value: { a: 'x' },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(invalid).not.toBe(true)
    expect(typeof invalid).toBe('string')
    expect(invalid).toContain('a')
    expect(jsonSchema.schema).not.toBeInstanceOf(Promise)

    const valid = await validateJSONSchema({
      jsonSchema,
      value: { a: 1 },
    })

    expect(valid).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a failed fetch instead of accepting every value when uri is missing', async () => {
    const fetchMock = vitest.fn(async () => {
      throw new TypeError('Failed to parse URL from undefined')
    })
    vitest.stubGlobal('fetch', fetchMock)

    const result = await validateJSONSchema({
      jsonSchema: {
        fileMatch: ['a://b/foo.json'],
        schema: customerSchema,
      } as any,
      value: { a: 'x' },
    })

    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
  })
})
