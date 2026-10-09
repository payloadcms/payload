import { isDeepStrictEqual } from 'node:util'

import type { JSONField } from '../../fields/config/types.js'
import type { UploadTransformer } from '../transformers/types.js'

import { transformStateJSONSchema, transformStateSchema } from './transformStateSchema.js'

/** Definitions enrich generated types; adapters remain responsible for custom-value validation. */
export function buildTransformStateJSONSchema({
  transformers,
}: {
  transformers: UploadTransformer[]
}): NonNullable<JSONField['jsonSchema']> {
  const schema = structuredClone(transformStateJSONSchema)
  const objectSchema = schema.schema.anyOf!.find((branch) => branch.type === 'object')!
  const properties = objectSchema.properties!

  for (const transformer of transformers) {
    for (const [key, definition] of Object.entries(transformer.transformDefinitions ?? {})) {
      if (
        Object.hasOwn(properties, key) &&
        (Object.hasOwn(transformStateSchema.unwrap().shape, key) ||
          !isDeepStrictEqual(properties[key], definition))
      ) {
        throw new Error(
          `Transformer "${transformer.slug}" cannot redefine transform key "${key}". Use a distinct custom key.`,
        )
      }
      Object.defineProperty(properties, key, {
        configurable: true,
        enumerable: true,
        value: structuredClone(definition),
        writable: true,
      })
    }
  }

  return {
    ...schema,
    inputSchema: structuredClone(transformStateJSONSchema.schema),
  }
}
