import type { Config } from 'payload'

import { configToJSONSchema, sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'

const buildSchema = ({
  defaultDepth,
  maxDepth,
  typeSafeDepth = true,
}: {
  defaultDepth?: number
  maxDepth?: number
  typeSafeDepth?: boolean
}) => {
  const config = {
    collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    defaultDepth,
    maxDepth,
    typescript: { generateInputTypes: true, typeSafeDepth },
  } as unknown as Config

  const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')

  return jsonSchema
}

describe('typescript.typeSafeDepth schema generation', () => {
  it('should emit no depth config or collection marker when disabled', () => {
    const jsonSchema = buildSchema({ typeSafeDepth: false })

    expect(jsonSchema.properties!.depth).toBeUndefined()
    expect(jsonSchema.required).not.toContain('depth')
    expect(jsonSchema.$defs!.posts.properties.__collection).toBeUndefined()
  })

  it('should emit depth literals derived from maxDepth and defaultDepth', () => {
    const jsonSchema = buildSchema({ defaultDepth: 1, maxDepth: 3 })
    const depth = jsonSchema.properties!.depth as any

    expect(depth.properties.allowed.enum).toStrictEqual([0, 1, 2, 3])
    expect(depth.properties.default.enum).toStrictEqual([1])
    expect(jsonSchema.required).toContain('depth')
  })

  it('should emit a decremented tuple with one entry per allowed depth', () => {
    const jsonSchema = buildSchema({ defaultDepth: 1, maxDepth: 3 })
    const decremented = (jsonSchema.properties!.depth as any).properties.decremented

    // Indexed by depth: index 0 is unused, index N holds N - 1.
    expect(decremented.items).toStrictEqual([
      { type: 'null' },
      { type: 'number', enum: [0] },
      { type: 'number', enum: [1] },
      { type: 'number', enum: [2] },
    ])
    expect(decremented.items).toHaveLength(decremented.minItems)
    expect(decremented.minItems).toBe(4)
    expect(decremented.maxItems).toBe(4)
  })

  it('should clamp a defaultDepth above maxDepth, matching the runtime clamp', () => {
    const jsonSchema = buildSchema({ defaultDepth: 5, maxDepth: 2 })
    const depth = jsonSchema.properties!.depth as any

    expect(depth.properties.default.enum).toStrictEqual([2])
    expect(depth.properties.allowed.enum).toContain(2)
  })

  it('should add the collection marker to output types only, not input types', () => {
    const jsonSchema = buildSchema({ maxDepth: 3 })

    expect(jsonSchema.$defs!.posts.properties.__collection).toStrictEqual({
      type: 'string',
      enum: ['posts'],
    })
    expect(jsonSchema.$defs!.posts_input.properties.__collection).toBeUndefined()
  })
})
