import type { JSONSchema4 } from 'json-schema'

import type { UploadTransformer } from '../transformers/types.js'

const nonNegativeInteger: JSONSchema4 = { type: 'integer', minimum: 0 }
const positiveInteger: JSONSchema4 = { type: 'integer', minimum: 1 }
const percentage: JSONSchema4 = { type: 'number', maximum: 100, minimum: 0 }

const strictObject = (
  schema: Pick<JSONSchema4, 'description' | 'properties' | 'required'>,
): JSONSchema4 => ({ type: 'object', additionalProperties: false, ...schema })

/**
 * Shapes for the built-in `_transforms` keys. Any other key is allowed and owned by the
 * transformer that reads it.
 */
export const transformStateObjectSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: true,
  properties: {
    clip: strictObject({
      description: 'Time range on the original, in milliseconds. Start inclusive, end exclusive.',
      properties: { endMs: positiveInteger, startMs: nonNegativeInteger },
      required: ['startMs', 'endMs'],
    }),
    crop: strictObject({
      description: 'Rectangle in original-file pixels, applied before resize and encoding.',
      properties: {
        height: positiveInteger,
        width: positiveInteger,
        x: nonNegativeInteger,
        y: nonNegativeInteger,
      },
      required: ['x', 'y', 'width', 'height'],
    }),
    encoding: {
      type: 'object',
      description: 'Encoding settings for the output format. Does not select the format.',
    },
    flip: strictObject({
      description: 'Mirror the image on one or both axes.',
      properties: { horizontal: { type: 'boolean' }, vertical: { type: 'boolean' } },
    }),
    focalPoint: strictObject({
      description: 'Preferred point as percentages of the original, from 0 to 100.',
      properties: { x: percentage, y: percentage },
      required: ['x', 'y'],
    }),
    metadataPolicy: strictObject({
      description: 'Keep or remove metadata embedded in the output file.',
      properties: { mode: { type: 'string', enum: ['preserve', 'strip'] } },
      required: ['mode'],
    }),
    pageRange: strictObject({
      description: 'One-based, inclusive page range on the original document.',
      properties: { endPage: positiveInteger, startPage: positiveInteger },
      required: ['startPage', 'endPage'],
    }),
    posterFrame: strictObject({
      description: 'Video frame to use as the poster, in milliseconds on the original.',
      properties: { timestampMs: nonNegativeInteger },
      required: ['timestampMs'],
    }),
    resize: strictObject({
      description: 'Target size for visual media.',
      properties: {
        fit: { type: 'string', enum: ['contain', 'cover', 'fill', 'inside', 'outside'] },
        height: positiveInteger,
        width: positiveInteger,
        withoutEnlargement: { type: 'boolean' },
      },
    }),
    rotate: strictObject({
      description: 'Clockwise rotation in degrees.',
      properties: { angle: { type: 'number' } },
      required: ['angle'],
    }),
  },
}

/** The `_transforms` keys that Payload defines. A transformer cannot define them again. */
export const builtInTransformKeys: readonly string[] = Object.keys(
  transformStateObjectSchema.properties!,
)

/** The `_transforms` object schema: the built-in shapes plus every key a transformer declares. */
export function getTransformStateObjectSchema({
  transformers,
}: {
  transformers: readonly UploadTransformer[]
}): JSONSchema4 {
  // Definition schemas use the draft that zod checks values with. This tree also goes to the type
  // generator, which reads draft 4. The rules that both drafts have mean the same in each.
  const declaredProperties: Record<string, JSONSchema4> = Object.fromEntries(
    transformers.flatMap(({ transformDefinitions }) =>
      (transformDefinitions ?? []).map(({ key, schema }) => [key, schema as JSONSchema4]),
    ),
  )

  return {
    ...transformStateObjectSchema,
    properties: { ...transformStateObjectSchema.properties, ...declaredProperties },
  }
}

/** `$ref` to the shared recursive `JsonValue` definition (see `configToJSONSchema`). */
const jsonValueRef: JSONSchema4 = { $ref: '#/$defs/payload.JsonValue' }

/**
 * Rewrite a transformer-declared value schema so the type it compiles to is
 * assignable to the `_transforms` `[k: string]: JsonValue` index signature.
 *
 * A declared schema such as `{ type: 'object' }` compiles to
 * `{ [k: string]: unknown }`, and `unknown` is not assignable to `JsonValue`,
 * so the generated `UploadTransforms` interface fails to compile. Object
 * schemas without an `additionalProperties` rule get `JsonValue` additional
 * properties instead, so their open-ended values stay JSON values — an object
 * with declared properties keeps them, and the same rewrite applies to nested
 * values. A schema with no constraining keywords at all accepts anything,
 * which also compiles to `unknown`, so it becomes a `JsonValue` reference
 * outright.
 *
 * This only affects the generated types: runtime validation still uses
 * `getTransformStateObjectSchema`, which keeps the declared schema verbatim.
 */
function toSerialisableValueSchema(schema: JSONSchema4): JSONSchema4 {
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []

  if (
    schema.type === undefined &&
    schema.properties === undefined &&
    schema.additionalProperties === undefined &&
    schema.items === undefined &&
    schema.anyOf === undefined &&
    schema.oneOf === undefined &&
    schema.allOf === undefined &&
    schema.$ref === undefined &&
    schema.enum === undefined &&
    schema.const === undefined &&
    schema.format === undefined &&
    schema.pattern === undefined
  ) {
    return { ...schema, $ref: jsonValueRef.$ref }
  }

  let next: JSONSchema4 = { ...schema }

  const isObject =
    types.includes('object') ||
    schema.properties !== undefined ||
    schema.additionalProperties !== undefined

  if (isObject) {
    const additionalProperties = schema.additionalProperties

    if (additionalProperties === true) {
      next = { ...next, additionalProperties: jsonValueRef }
    } else if (additionalProperties === undefined) {
      // An object without an `additionalProperties` rule compiles with a
      // `[k: string]: unknown` index signature, which is not assignable to
      // `JsonValue` — whether or not it declares `properties`. Type the
      // extra values as JSON values instead. (An object with declared
      // properties keeps them; only its open-ended values change.)
      next = { ...next, additionalProperties: jsonValueRef }
    } else if (typeof additionalProperties === 'object') {
      next = {
        ...next,
        additionalProperties: toSerialisableValueSchema(additionalProperties),
      }
    }

    if (schema.properties !== undefined) {
      next = {
        ...next,
        properties: Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) => [
            key,
            toSerialisableValueSchema(value as JSONSchema4),
          ]),
        ),
      }
    }
  }

  if (types.includes('array')) {
    if (next.items === undefined) {
      next = { ...next, items: jsonValueRef }
    } else if (Array.isArray(next.items)) {
      next = {
        ...next,
        items: next.items.map((item) => toSerialisableValueSchema(item as JSONSchema4)),
      }
    } else if (typeof next.items === 'object') {
      next = { ...next, items: toSerialisableValueSchema(next.items as JSONSchema4) }
    }
  }

  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    const branches = next[key]

    if (Array.isArray(branches)) {
      next = { ...next, [key]: branches.map((branch) => toSerialisableValueSchema(branch)) }
    }
  }

  return next
}

/** The `_transforms` field schema, which also allows `null`. */
export function getTransformStateSchema({
  transformers,
}: {
  transformers: readonly UploadTransformer[]
}): JSONSchema4 {
  const objectSchema = getTransformStateObjectSchema({ transformers })

  // The generated `_transforms` type must be JSON-serialisable: TanStack
  // Start's `createServerFn` rejects `unknown`, and the plain object schemas
  // above compile to `{ [k: string]: unknown }` (fixes #19783).
  // Transformer-owned keys and the `encoding` settings are JSON values, so
  // they reference the shared recursive `JsonValue` definition (defined in
  // `configToJSONSchema`'s top-level `$defs`, under the reserved
  // `payload.JsonValue` key) instead of `unknown`.
  // This only affects the generated types: runtime validation still uses
  // `getTransformStateObjectSchema`, which stays permissive.
  const properties: Record<string, JSONSchema4> = {}

  for (const [key, schema] of Object.entries(objectSchema.properties ?? {})) {
    // Built-in keys already have precise shapes. Transformer-declared keys are
    // rewritten so the type they compile to stays assignable to the
    // `_transforms` index signature.
    properties[key] = builtInTransformKeys.includes(key)
      ? schema
      : toSerialisableValueSchema(schema)
  }

  return {
    anyOf: [
      {
        ...objectSchema,
        additionalProperties: jsonValueRef,
        properties: {
          ...properties,
          encoding: {
            type: 'object',
            additionalProperties: jsonValueRef,
            description: 'Encoding settings for the output format. Does not select the format.',
          },
        },
      },
      { type: 'null' },
    ],
  }
}
