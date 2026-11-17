import type { core } from 'zod'

import { fromJSONSchema } from 'zod'

import type { UploadTransformer } from './types.js'

import { builtInTransformKeys } from '../transformState/transformStateSchema.js'

const MIME_TOKEN_PATTERN = /^[\w!#$&^.+-]+$/

const CAPABILITY_KEYS = ['init', 'canTransform', 'transformFile', 'handleRequest'] as const

function isValidMimeTypePattern(pattern: unknown): boolean {
  if (typeof pattern !== 'string' || pattern.length === 0) {
    return false
  }

  if (pattern === '*/*') {
    return true
  }

  const [type, subtype] = pattern.split('/')

  if (type === undefined || subtype === undefined || pattern.split('/').length !== 2) {
    return false
  }

  if (!MIME_TOKEN_PATTERN.test(type)) {
    return false
  }

  return subtype === '*' || MIME_TOKEN_PATTERN.test(subtype)
}

/**
 * Validates `upload.transformers` at startup: unique, non-empty slugs; at least one
 * well-formed MIME pattern per transformer; every declared capability is a function; and every
 * transform definition has a new, unique key, a usable JSON Schema and a function `validate`.
 * Called once for the authored list and again after every transformer `init()` runs,
 * since `init()` may return a mutated transformers list.
 */
export function validateTransformers({
  transformers,
}: {
  transformers: UploadTransformer[]
}): void {
  const errors: string[] = []
  const slugCounts = new Map<string, number>()
  const definitionOwners = new Map<string, string[]>()

  transformers.forEach((transformer, index) => {
    const label = `upload.transformers[${index}]`
    const slug = transformer?.slug

    if (typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push(`${label} must have a non-empty \`slug\`.`)
    } else {
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1)
    }

    const identifier = typeof slug === 'string' && slug.length > 0 ? `"${slug}"` : label

    if (!Array.isArray(transformer?.mimeTypes) || transformer.mimeTypes.length === 0) {
      errors.push(`Transformer ${identifier} must declare at least one MIME type in \`mimeTypes\`.`)
    } else {
      transformer.mimeTypes.forEach((mimeType) => {
        if (!isValidMimeTypePattern(mimeType)) {
          errors.push(
            `Transformer ${identifier} has an invalid MIME type pattern: "${String(mimeType)}". ` +
              `Use an exact value (e.g. "image/png"), a category wildcard (e.g. "image/*"), or "*/*".`,
          )
        }
      })
    }

    for (const capability of CAPABILITY_KEYS) {
      const value = transformer?.[capability]

      if (value !== undefined && typeof value !== 'function') {
        errors.push(`Transformer ${identifier}'s \`${capability}\` must be a function.`)
      }
    }

    errors.push(
      ...getDefinitionErrors({ definitionOwners, identifier, transformer: transformer ?? {} }),
    )
  })

  for (const [key, owners] of definitionOwners) {
    if (owners.length > 1) {
      errors.push(
        `The _transforms key "${key}" is defined by more than one transformer: ${owners.join(', ')}. Only one transformer can define a key.`,
      )
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      errors.push(
        `Duplicate upload transformer slug: "${slug}" is used ${count} times. Every transformer must have a unique \`slug\`.`,
      )
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid \`upload.transformers\` configuration:\n${errors.join('\n')}`)
  }
}

/** Checks one transformer's `transformDefinitions`, and records each key's owner. */
function getDefinitionErrors({
  definitionOwners,
  identifier,
  transformer,
}: {
  /** Each defined key and the transformers that define it, to find duplicates. */
  definitionOwners: Map<string, string[]>
  identifier: string
  transformer: Partial<UploadTransformer>
}): string[] {
  const { transformDefinitions } = transformer

  if (transformDefinitions === undefined) {
    return []
  }

  if (!Array.isArray(transformDefinitions)) {
    return [`Transformer ${identifier}'s \`transformDefinitions\` must be an array.`]
  }

  const errors: string[] = []

  for (const definition of transformDefinitions) {
    const key = definition?.key

    if (typeof key !== 'string' || key.trim().length === 0) {
      errors.push(`Transformer ${identifier} has a transform definition without a \`key\`.`)
      continue
    }

    if (builtInTransformKeys.includes(key)) {
      errors.push(
        `Transformer ${identifier} defines "${key}", which is a built-in _transforms key. Choose another key.`,
      )
    }

    definitionOwners.set(key, [...(definitionOwners.get(key) ?? []), identifier])

    const schemaError = getSchemaError({ key, schema: definition.schema })

    if (schemaError) {
      errors.push(
        `Transformer ${identifier}'s definition of "${key}" has an invalid schema: ${schemaError}`,
      )
    }

    if (definition.validate !== undefined && typeof definition.validate !== 'function') {
      errors.push(
        `Transformer ${identifier}'s definition of "${key}" has a \`validate\` that is not a function.`,
      )
    }
  }

  return errors
}

/**
 * Why a JSON Schema cannot be used to check values, or `undefined` when it can. The schema is read
 * where the `_transforms` schema puts it, under `properties`, so a `$ref` into the definition's own
 * schema fails here and not on the first save.
 */
function getSchemaError({ key, schema }: { key: string; schema: unknown }): string | undefined {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return 'it must be a JSON Schema object'
  }

  try {
    fromJSONSchema({ type: 'object', properties: { [key]: schema } } as core.JSONSchema.JSONSchema)
  } catch (err) {
    return err instanceof Error ? err.message : 'it cannot be read'
  }

  return undefined
}
