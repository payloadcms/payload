import type { JSONSchema4 } from 'json-schema'

import { describe, expect, it } from 'vitest'

import { convertCollectionSchemaToZod } from './convertCollectionSchemaToZod.js'

const schema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
  },
  required: ['id'],
}

describe('convertCollectionSchemaToZod', () => {
  // The result is consumed as a ZodObject: resource/update.ts calls `.partial()` on it and
  // global/update.ts reads `.shape`. Routing the generated source through ts.transpileModule
  // used to make the helper return the string "use strict" instead, so both callers threw and
  // the MCP request never resolved.
  it('returns a ZodObject rather than the generated source', () => {
    const result = convertCollectionSchemaToZod(schema)

    expect(typeof result).not.toBe('string')
    expect(typeof result.partial).toBe('function')
    expect(Object.keys(result.shape).sort()).toEqual(['id', 'title'])
  })

  it('produces a schema the update tools can build partial input from', () => {
    const result = convertCollectionSchemaToZod(schema)

    expect(() => result.partial().shape).not.toThrow()
    expect(result.partial().safeParse({ title: 'only the title' }).success).toBe(true)
  })

  // Descriptions reach the generated source as `.describe("...")` string literals, so they are
  // the one place author-supplied text is interpolated into code that gets evaluated.
  it('escapes description text rather than interpolating it as code', () => {
    const result = convertCollectionSchemaToZod({
      type: 'object',
      properties: {
        a: { type: 'string', description: 'quote " brace }) backtick ` and ${1 + 1}' },
      },
    })

    expect(typeof result.partial).toBe('function')
    expect(result.safeParse({ a: 'ok' }).success).toBe(true)
  })

  it('validates against the source schema', () => {
    const result = convertCollectionSchemaToZod(schema)

    expect(result.safeParse({ id: 'abc', title: 'hello' }).success).toBe(true)
    expect(result.safeParse({ title: 'missing the required id' }).success).toBe(false)
  })
})
