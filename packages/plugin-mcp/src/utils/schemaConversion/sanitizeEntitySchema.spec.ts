import { describe, expect, it } from 'vitest'

import type { JsonSchemaType } from '../../types.js'

import { sanitizeEntitySchema } from './sanitizeEntitySchema.js'

describe('sanitizeEntitySchema', () => {
  it('renames the Lexical node-union definition to a short name and keeps it a strict oneOf', () => {
    // Shaped like the schema the MCP server prepares for a collection with a Lexical richText field
    // (Payload's `input` variant): a `$defs` node union (a `oneOf` of node shapes). The input variant
    // already types the relationship node's `value` as a bare ID - there is no populated-doc `$ref` to
    // reduce here (the variant did that upstream), so sanitize leaves the value untouched.
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
                value: { type: 'string', description: 'The related document ID.' },
              },
              required: ['type'],
            },
          ],
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
        // `oneOf` - not loosened to `anyOf`.
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
                // The value is already ID-only from the input variant - left as-is.
                value: { type: 'string', description: 'The related document ID.' },
              },
              required: ['type'],
            },
          ],
        },
      },
      properties: {
        // Managed fields (createdAt/updatedAt/_status) are excluded upstream by the `input` variant;
        // `id` stays because it's a valid optional input (a client may supply a custom ID).
        id: { type: 'string' },
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
