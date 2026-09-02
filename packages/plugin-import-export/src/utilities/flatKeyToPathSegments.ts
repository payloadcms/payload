import type { FlattenedBlock, FlattenedField } from 'payload'

import { getBlockFlattenedFields, getNestedFlattenedFields } from './flattenedFields.js'

type Args = {
  /**
   * Resolved block definitions, used to look up blocks that a `blocks` field
   * references by slug rather than defines inline. Pass `req.payload.blocks`.
   */
  blocksBySlug?: Record<string, FlattenedBlock>
  fields: FlattenedField[]
  flatKey: string
  /**
   * Configured locale codes. When omitted, a locale segment is recognized by
   * shape (`en`, `en_US`) instead — the same heuristic `unflattenPostProcess` uses.
   */
  localeCodes?: string[]
}

type ResolveContext = Pick<Args, 'blocksBySlug' | 'localeCodes'>

/** `null` rest means the prefix consumed the whole key. */
type Taken = {
  rest: null | string
}

const indexSegment = /^\d+$/

const localeSegment = /^[a-z]{2}(?:_[A-Z]{2})?$/

const segmentsCache = new WeakMap<FlattenedField[], Map<string, null | string[]>>()

/**
 * Resolves a flattened CSV column name into the path segments that address it
 * within a document, using the field schema rather than assuming every
 * underscore is a nesting separator. `vat_number` resolves to `['vat_number']`,
 * while `group_vat_number` resolves to `['group', 'vat_number']`.
 *
 * Array indices, block slugs and locale codes are emitted as their own segments,
 * so a key the naive `split('_')` already handled correctly resolves to the
 * identical segments.
 *
 * Returns `undefined` when the schema cannot account for the key — extra CSV
 * columns, or the populated relationship data an export at depth > 0 produces.
 * Callers are expected to fall back to `flatKey.split('_')` in that case.
 *
 * Field names are matched longest-first with backtracking, so a flat field named
 * `vat_number` wins over a `vat` group containing `number`. Such a schema is
 * ambiguous on export too — both produce a single `vat_number` column — so the
 * collision cannot be resolved from the CSV alone.
 */
export const flatKeyToPathSegments = ({
  blocksBySlug,
  fields,
  flatKey,
  localeCodes,
}: Args): string[] | undefined => {
  let cached = segmentsCache.get(fields)

  if (!cached) {
    cached = new Map()
    segmentsCache.set(fields, cached)
  }

  // Resolution depends on the locales as well as the schema, and a column set is
  // re-resolved for every imported row — worth memoizing across rows.
  const cacheKey = `${localeCodes?.join(',') ?? ''}:${flatKey}`
  const memoized = cached.get(cacheKey)

  if (memoized !== undefined) {
    return memoized ?? undefined
  }

  const resolved = resolveInFields(fields, flatKey, { blocksBySlug, localeCodes })
  cached.set(cacheKey, resolved ?? null)

  return resolved
}

const resolveInFields = (
  fields: FlattenedField[],
  key: string,
  ctx: ResolveContext,
): string[] | undefined => {
  const candidates = fields
    .filter((field): field is { name: string } & FlattenedField =>
      Boolean('name' in field && field.name),
    )
    .sort((a, b) => b.name.length - a.name.length)

  for (const field of candidates) {
    const taken = takePrefix(key, field.name)
    if (!taken) {
      continue
    }

    const suffix = resolveField({ ctx, field, tail: taken.rest })
    if (suffix) {
      return [field.name, ...suffix]
    }
  }

  return undefined
}

/**
 * Consumes an optional locale segment before the field's own suffix handling, so
 * both `title_en` and localized-group keys like `group_en_vat_number` resolve.
 * Falls back to treating the tail as part of the field when the locale reading
 * doesn't resolve.
 */
const resolveField = ({
  ctx,
  field,
  tail,
}: {
  ctx: ResolveContext
  field: FlattenedField
  tail: null | string
}): string[] | undefined => {
  if (field.localized && tail !== null) {
    const taken = takeLocale(tail, ctx.localeCodes)

    if (taken) {
      const suffix = resolveFieldBody({ ctx, field, tail: taken.rest })
      if (suffix) {
        return [taken.locale, ...suffix]
      }
    }
  }

  return resolveFieldBody({ ctx, field, tail })
}

const resolveFieldBody = ({
  ctx,
  field,
  tail,
}: {
  ctx: ResolveContext
  field: FlattenedField
  tail: null | string
}): string[] | undefined => {
  switch (field.type) {
    case 'array': {
      if (tail === null) {
        return undefined
      }

      const [index, rest] = splitFirstSegment(tail)
      if (!indexSegment.test(index)) {
        return undefined
      }
      if (rest === null) {
        return [index]
      }

      const suffix = resolveInFields(getNestedFlattenedFields(field) ?? [], rest, ctx)

      return suffix && [index, ...suffix]
    }

    case 'blocks': {
      if (tail === null) {
        return undefined
      }

      const [index, rest] = splitFirstSegment(tail)
      if (!indexSegment.test(index) || rest === null) {
        return undefined
      }

      return resolveInBlocks({ ctx, field, index, key: rest })
    }

    case 'group':
    case 'tab': {
      if (tail === null) {
        return undefined
      }

      return resolveInFields(getNestedFlattenedFields(field) ?? [], tail, ctx)
    }

    case 'relationship':
    case 'upload': {
      if (tail === null) {
        return []
      }

      const [index, rest] = splitFirstSegment(tail)

      // hasMany: `rel_0`, or `rel_0_id` / `rel_0_relationTo` when polymorphic
      if (indexSegment.test(index)) {
        if (rest === null) {
          return [index]
        }

        return isPolymorphicSuffix(rest) ? [index, rest] : undefined
      }

      // hasOne polymorphic: `rel_id` / `rel_relationTo`
      return isPolymorphicSuffix(tail) ? [tail] : undefined
    }

    default: {
      if (tail === null) {
        return []
      }

      // hasMany scalars are exported one column per index, e.g. `tags_0`
      const isHasMany = 'hasMany' in field && field.hasMany === true

      return isHasMany && indexSegment.test(tail) ? [tail] : undefined
    }
  }
}

const resolveInBlocks = ({
  ctx,
  field,
  index,
  key,
}: {
  ctx: ResolveContext
  field: FlattenedField
  index: string
  key: string
}): string[] | undefined => {
  const blocks = 'blocks' in field ? (field.blocks ?? []) : []

  const definitions = blocks
    .map((block) => (typeof block === 'string' ? ctx.blocksBySlug?.[block] : block))
    .filter((block): block is FlattenedBlock => Boolean(block))
    .sort((a, b) => b.slug.length - a.slug.length)

  for (const block of definitions) {
    const taken = takePrefix(key, block.slug)
    if (!taken || taken.rest === null) {
      continue
    }

    if (taken.rest === 'blockType') {
      return [index, block.slug, 'blockType']
    }

    const suffix = resolveInFields(getBlockFlattenedFields(block), taken.rest, ctx)
    if (suffix) {
      return [index, block.slug, ...suffix]
    }
  }

  return undefined
}

const takePrefix = (key: string, prefix: string): Taken | undefined => {
  if (key === prefix) {
    return { rest: null }
  }

  if (key.startsWith(`${prefix}_`)) {
    return { rest: key.slice(prefix.length + 1) }
  }

  return undefined
}

const takeLocale = (
  key: string,
  localeCodes: string[] | undefined,
): ({ locale: string } & Taken) | undefined => {
  for (const candidate of localeCandidates(key, localeCodes)) {
    const taken = takePrefix(key, candidate)
    if (taken) {
      return { locale: candidate, rest: taken.rest }
    }
  }

  return undefined
}

/**
 * Locale codes to try against the head of `key`, longest first so `en_US` wins
 * over a co-existing `en`. Without configured codes, the first one or two
 * segments are offered when they look like a locale.
 */
const localeCandidates = (key: string, localeCodes: string[] | undefined): string[] => {
  if (localeCodes && localeCodes.length > 0) {
    return [...localeCodes].sort((a, b) => b.length - a.length)
  }

  const [first, second] = key.split('_')

  return [second === undefined ? undefined : `${first}_${second}`, first].filter(
    (candidate): candidate is string => candidate !== undefined && localeSegment.test(candidate),
  )
}

const splitFirstSegment = (key: string): [string, null | string] => {
  const boundary = key.indexOf('_')

  return boundary === -1 ? [key, null] : [key.slice(0, boundary), key.slice(boundary + 1)]
}

const isPolymorphicSuffix = (segment: string): boolean =>
  segment === 'id' || segment === 'relationTo'
