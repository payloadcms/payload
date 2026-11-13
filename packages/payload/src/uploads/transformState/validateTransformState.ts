import type { core } from 'zod'

import { isDeepStrictEqual } from 'node:util'
import { fromJSONSchema } from 'zod'

import type { Validate } from '../../fields/config/types.js'
import type { Document, JsonObject, PayloadRequest } from '../../types/index.js'
import type { UploadTransformer } from '../transformers/types.js'
import type { PixelCrop } from './cropUnits.js'

import { getTransformStateObjectSchema } from './transformStateSchema.js'

type Dimensions = { height?: null | number; width?: null | number }

/** A `_transforms` error, on the path of the key that failed: `_transforms.<key>`. */
export type TransformStateError = { message: string; path: string }

/** The error path of a `_transforms` key. Without a key, the whole field. */
export const getTransformStatePath = (key?: PropertyKey): string =>
  key === undefined ? '_transforms' : `_transforms.${String(key)}`

/**
 * Checks `_transforms` against its schema (the built-in shapes and every declared key), then
 * checks the crop against the original's size.
 */
export function getTransformStateError({
  original,
  transformers,
  value,
}: {
  original?: Dimensions | null
  transformers: readonly UploadTransformer[]
  value: unknown
}): TransformStateError | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  // `null` returned above, so check the object schema directly: its errors name the failing key.
  // zod ignores `$schema` at runtime, so the wider `JSONSchema4` type is safe to pass through.
  const schemaResult = fromJSONSchema(
    getTransformStateObjectSchema({ transformers }) as core.JSONSchema.JSONSchema,
  ).safeParse(value)

  if (!schemaResult.success) {
    const { issues } = schemaResult.error

    return {
      message: issues
        .map((issue) =>
          issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        )
        .join(', '),
      path: getTransformStatePath(issues[0]?.path[0]),
    }
  }

  const crop = (value as { crop?: PixelCrop }).crop

  if (
    crop &&
    original?.width &&
    original?.height &&
    (crop.x + crop.width > original.width || crop.y + crop.height > original.height)
  ) {
    return {
      message: `crop: must fit inside the original (${original.width} x ${original.height})`,
      path: getTransformStatePath('crop'),
    }
  }

  return undefined
}

/**
 * Runs the `validate` of each declared key in `keys` that has a value, in transformer order.
 * Returns the first error. Without `keys`, every key in `transforms` is checked.
 */
export async function getTransformDefinitionError({
  collectionSlug,
  doc,
  keys,
  originalDoc,
  req,
  transforms,
}: {
  collectionSlug: string
  doc: Readonly<Document>
  keys?: readonly string[]
  originalDoc: Readonly<Document>
  req: PayloadRequest
  transforms: unknown
}): Promise<TransformStateError | undefined> {
  if (!transforms || typeof transforms !== 'object' || Array.isArray(transforms)) {
    return undefined
  }

  const values = transforms as JsonObject

  for (const { transformDefinitions } of req.payload.config.upload?.transformers ?? []) {
    for (const { key, validate } of transformDefinitions ?? []) {
      // `hasOwn`: a key such as `toString` must not read the value from the prototype.
      if (
        !validate ||
        !Object.hasOwn(values, key) ||
        values[key] === undefined ||
        (keys && !keys.includes(key))
      ) {
        continue
      }

      const result = await validate(values[key], {
        collectionSlug,
        doc,
        originalDoc,
        req,
        transforms: values,
      })

      if (result !== true) {
        return { message: result, path: getTransformStatePath(key) }
      }
    }
  }

  return undefined
}

/**
 * The `_transforms` field validator. A value equal to the saved one is kept unchecked, so an
 * update that leaves `_transforms` out still saves after a definition's schema changed.
 */
export const validateTransformState: Validate = (value, { data, previousValue, req }) =>
  isDeepStrictEqual(value, previousValue) ||
  (getTransformStateError({
    original: (data as { original?: Dimensions })?.original,
    transformers: req.payload.config.upload?.transformers ?? [],
    value,
  })?.message ??
    true)
