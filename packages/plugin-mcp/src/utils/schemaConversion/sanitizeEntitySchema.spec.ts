import { describe, expect, it } from 'vitest'

import type { JsonSchemaType } from '../../types.js'

import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

describe('sanitizeEntitySchema', () => {
  it('keeps a Lexical node union strict (oneOf) while simplifying relationship values to IDs', () => {
    // Shaped like the schema the MCP server prepares for a collection with a Lexical richText field:
    // a `$defs` node union (a `oneOf` of node shapes) where a relationship node's `value` is either
    // an ID or a `$ref` to the populated related collection.
    const standalone: JsonSchemaType = {
      type: 'object',
      $defs: {
        LexicalNodes_ABCDEF12: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: { type: { const: 'paragraph' } },
              required: ['type'],
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: { const: 'relationship' },
                value: { oneOf: [{ type: 'string' }, { $ref: '#/$defs/posts' }] },
              },
              required: ['type'],
            },
          ],
        },
        posts: {
          type: 'object',
          additionalProperties: false,
          properties: { id: { type: 'string' }, title: { type: 'string' } },
        },
      },
      properties: {
        id: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            root: {
              type: 'object',
              properties: {
                children: { type: 'array', items: { $ref: '#/$defs/LexicalNodes_ABCDEF12' } },
              },
            },
          },
        },
      },
    }

    expect(sanitizeEntitySchema(standalone)).toStrictEqual({
      type: 'object',
      $defs: {
        // The node union is renamed to a short, readable `node`, and stays a strict discriminated
        // `oneOf` - not loosened to `anyOf`...
        node: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: { type: { const: 'paragraph' } },
              required: ['type'],
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: { const: 'relationship' },
                // ...while the relationship `value` is simplified to a bare ID (the populated-doc `$ref` is dropped).
                value: { type: 'string', description: 'The ID of the related "posts" document.' },
              },
              required: ['type'],
            },
          ],
        },
        posts: {
          type: 'object',
          additionalProperties: false,
          properties: { id: { type: 'string' }, title: { type: 'string' } },
        },
      },
      properties: {
        // `id` is dropped - it's a Payload-managed field MCP clients never set.
        content: {
          type: 'object',
          properties: {
            root: {
              type: 'object',
              properties: {
                children: { type: 'array', items: { $ref: '#/$defs/node' } },
              },
            },
          },
        },
      },
    })
  })
})
