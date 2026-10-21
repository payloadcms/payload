import type { FlattenedField } from '../../../fields/config/types.js'
import type { PayloadRequest, Sort, Where, WhereField } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { isNestedRelationshipQuery } from '../../../database/isNestedRelationshipQuery.js'
import { encodeBranchProjectionID } from './branchProjectionCodec.js'

type Path = {
  field?: FlattenedField
  hasEncodedReferences: boolean
  kind: 'ordinary' | 'polymorphic-relation' | 'polymorphic-value' | 'relationship'
  locales: string[]
  path: string
  targets: string[]
}

/** Translate logical predicates before native filtering, never after pagination. */
export const compileBranchProjectionWhere = ({
  allowMissingFields = false,
  branchID,
  collection,
  req,
  where = {},
}: {
  allowMissingFields?: boolean
  branchID: BranchHeadID
  collection: string
  req: PayloadRequest
  where?: Where
}): Where => {
  const result: Where = {}

  for (const [path, condition] of Object.entries(where)) {
    if ((path.toLowerCase() === 'and' || path.toLowerCase() === 'or') && Array.isArray(condition)) {
      result[path.toLowerCase()] = condition.map((where) =>
        compileBranchProjectionWhere({ allowMissingFields, branchID, collection, req, where }),
      )
      continue
    }

    if (!condition || Array.isArray(condition) || typeof condition !== 'object') {
      throw new Error('Invalid logical branch query condition.')
    }

    const resolved = compileBranchProjectionPath({ allowMissingFields, collection, path, req })
    const operators: Record<string, unknown> = {}

    for (const [operator, value] of Object.entries(condition)) {
      const isPolymorphicLiteral =
        resolved.kind === 'relationship' &&
        resolved.field &&
        'relationTo' in resolved.field &&
        Array.isArray(resolved.field.relationTo) &&
        isNestedRelationshipQuery(value) &&
        typeof value.relationTo === 'string' &&
        Object.hasOwn(value, 'value')

      if (
        isPolymorphicLiteral ||
        (resolved.kind === 'relationship' &&
          Array.isArray(value) &&
          value.some(
            (item) => isNestedRelationshipQuery(item) && Object.hasOwn(item, 'relationTo'),
          ))
      ) {
        const encodeLiteral = (item: unknown): unknown => {
          if (
            !isNestedRelationshipQuery(item) ||
            typeof item.relationTo !== 'string' ||
            !resolved.targets.includes(item.relationTo)
          ) {
            throw new Error('Invalid polymorphic relationship query literal.')
          }

          const target = resolved.hasEncodedReferences
            ? getProjectionSlug({ collection: item.relationTo, req })
            : null

          return {
            relationTo: target ?? item.relationTo,
            value: target
              ? encodeBranchProjectionID({ branchID, logicalID: assertID({ value: item.value }) })
              : item.value,
          }
        }

        operators[operator] = Array.isArray(value) ? value.map(encodeLiteral) : encodeLiteral(value)
      } else if (resolved.kind === 'relationship' && isNestedRelationshipQuery(value)) {
        if (resolved.targets.length !== 1) {
          throw new Error('Nested polymorphic relationship predicates are not supported.')
        }

        operators[operator] = compileBranchProjectionWhere({
          branchID,
          collection: resolved.targets[0]!,
          req,
          where: value,
        })
      } else if (resolved.kind === 'relationship') {
        if (['exists', 'intersects', 'near', 'within'].includes(operator)) {
          operators[operator] = value
          continue
        }

        if (!['contains', 'equals', 'in', 'not_equals', 'not_in'].includes(operator)) {
          if (resolved.targets.length !== 1) {
            throw new Error('Polymorphic relationship comparisons require an explicit value path.')
          }

          const logicalPath = `${resolved.path}.${getProjectionSlug({ collection: resolved.targets[0]!, req }) ? '_branchProjection.logicalID' : 'id'}`
          const previous = result[logicalPath]

          result[logicalPath] = {
            ...(previous && !Array.isArray(previous) ? previous : {}),
            [operator]: structuredClone(value),
          }
          continue
        }

        const values = Array.isArray(value) ? value : [value]
        const encoded = values.flatMap((value) => {
          if (value == null) {
            return [value]
          }

          const results = new Set<unknown>()

          for (const target of resolved.targets) {
            if (resolved.hasEncodedReferences && getProjectionSlug({ collection: target, req })) {
              results.add(encodeBranchProjectionID({ branchID, logicalID: assertID({ value }) }))
            } else {
              results.add(value)
            }
          }

          return [...results]
        })

        if (!Array.isArray(value) && encoded.length <= 1) {
          operators[operator] = encoded[0]
        } else {
          operators[operator] = encoded
        }
      } else if (resolved.kind === 'polymorphic-relation') {
        const translate = (value: unknown): unknown =>
          typeof value === 'string' && resolved.hasEncodedReferences
            ? (getProjectionSlug({ collection: value, req }) ?? value)
            : value

        operators[operator] = Array.isArray(value) ? value.map(translate) : translate(value)
      } else {
        operators[operator] = structuredClone(value)
      }
    }

    if (Object.keys(operators).length) {
      result[resolved.path] = operators as WhereField
    }
  }

  return result
}

export const compileBranchProjectionSort = ({
  allowMissingFields = false,
  collection,
  req,
  sort,
}: {
  allowMissingFields?: boolean
  collection: string
  req: PayloadRequest
  sort?: Sort
}): string[] => {
  const config = req.payload.collections[collection]?.config
  const original = sort ?? config?.defaultSort ?? (config?.timestamps ? '-createdAt' : '-id')
  const incoming = typeof original === 'string' ? [original] : [...original]
  const result = incoming.map((sort) => {
    const isDescending = sort.startsWith('-')
    const path = isDescending ? sort.slice(1) : sort

    const resolved = compileBranchProjectionPath({ allowMissingFields, collection, path, req })
    const sortedPath =
      resolved.kind === 'relationship'
        ? `${resolved.path}.${resolved.targets.length === 1 ? (getProjectionSlug({ collection: resolved.targets[0]!, req }) ? '_branchProjection.logicalID' : 'id') : 'value'}`
        : resolved.path

    return `${isDescending ? '-' : ''}${sortedPath}`
  })

  const identityPath = getProjectionSlug({ collection, req })
    ? req.payload.collections[collection]?.config.custom?.branchQueryGlobalSource
      ? '_branchProjection.nativeGlobalID'
      : '_branchProjection.logicalID'
    : 'id'
  if (!result.some((sort) => sort.replace(/^-/, '') === identityPath)) {
    result.push(identityPath)
  }

  return result
}

export const compileBranchProjectionPath = ({
  allowMissingFields = false,
  collection,
  path,
  req,
}: {
  allowMissingFields?: boolean
  collection: string
  path: string
  req: PayloadRequest
}): Path => {
  const segments = path.replace(/__/g, '.').split('.')
  const output: string[] = []
  const locales: string[] = []
  let parentIsLocalized = false
  const source = req.payload.collections[collection]?.config
  let fields: FlattenedField[] = source?.flattenedFields ?? []
  let hasGlobalIdentity = Boolean(source?.custom?.branchQueryGlobalSource)
  let hasPrivateIdentity = Boolean(getProjectionSlug({ collection, req }))
  let isProjectionRelation = hasPrivateIdentity
  let lastField: FlattenedField | undefined

  if (!source) {
    throw new Error('Invalid or private branch query path.')
  }

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]!

    if (segment === '_branchProjection') {
      throw new Error('Invalid or private branch query path.')
    }
    if (segment === 'id') {
      output.push(
        ...(hasPrivateIdentity
          ? ['_branchProjection', hasGlobalIdentity ? 'nativeGlobalID' : 'logicalID']
          : ['id']),
      )
      continue
    }

    const field: FlattenedField | undefined = fields.find(({ name }) => name === segment)

    if (!field) {
      if (allowMissingFields) {
        return { hasEncodedReferences: false, kind: 'ordinary', locales, path, targets: [] }
      }
      throw new Error(`Unknown branch query field "${segment}".`)
    }

    lastField = field
    output.push(segment)

    if (
      'localized' in field &&
      field.localized &&
      !parentIsLocalized &&
      req.payload.config.localization &&
      req.payload.config.localization.localeCodes.includes(segments[index + 1]!)
    ) {
      locales.push(segments[index + 1]!)
      output.push(segments[++index]!)
    }

    if (field.type === 'relationship' || field.type === 'upload' || field.type === 'join') {
      const relationTo: string | string[] =
        field.type === 'join' ? field.collection : field.relationTo
      const targets = typeof relationTo === 'string' ? [relationTo] : relationTo

      if (index === segments.length - 1) {
        return {
          field,
          hasEncodedReferences: isProjectionRelation,
          kind: 'relationship',
          locales,
          path: output.join('.'),
          targets,
        }
      }

      if (typeof relationTo !== 'string') {
        const tail = segments[++index]

        if (index !== segments.length - 1 || (tail !== 'relationTo' && tail !== 'value')) {
          throw new Error('Nested polymorphic relationship paths are not supported.')
        }

        output.push(tail)
        return {
          field,
          hasEncodedReferences: isProjectionRelation,
          kind: tail === 'value' ? 'polymorphic-value' : 'polymorphic-relation',
          locales,
          path: output.join('.'),
          targets,
        }
      }

      hasGlobalIdentity = false
      parentIsLocalized = false
      fields = req.payload.collections[relationTo]!.config.flattenedFields
      isProjectionRelation = Boolean(getProjectionSlug({ collection: relationTo, req }))
      hasPrivateIdentity = isProjectionRelation
    } else if ('flattenedFields' in field) {
      hasGlobalIdentity = false
      parentIsLocalized ||= 'localized' in field && Boolean(field.localized)
      fields = field.flattenedFields
      hasPrivateIdentity = field.type === 'array' && isProjectionRelation
    } else if (field.type === 'blocks') {
      hasGlobalIdentity = false
      parentIsLocalized ||= Boolean(field.localized)
      fields = field.blocks.flatMap(
        (reference) =>
          (typeof reference === 'string' ? req.payload.blocks[reference]! : reference)
            .flattenedFields,
      )
      hasPrivateIdentity = isProjectionRelation
    } else if (index !== segments.length - 1) {
      if (field.type === 'json' || field.type === 'richText') {
        output.push(...segments.slice(index + 1))
        break
      }

      throw new Error('A branch query cannot traverse this field.')
    }
  }

  return {
    field: lastField,
    hasEncodedReferences: isProjectionRelation,
    kind: 'ordinary',
    locales,
    path: output.join('.'),
    targets: [],
  }
}

/** Identify explicit locale qualifiers from the schema, never from arbitrary key/value strings. */
export const collectBranchQueryLocales = ({
  allowMissingFields = false,
  collection,
  req,
  sort,
  where,
}: {
  allowMissingFields?: boolean
  collection: string
  req: PayloadRequest
  sort?: Sort
  where?: Where
}): string[] => {
  const locales = new Set<string>()
  const observe = ({ collection, where }: { collection: string; where?: Where }): void => {
    for (const [path, condition] of Object.entries(where ?? {})) {
      if (['and', 'or'].includes(path.toLowerCase()) && Array.isArray(condition)) {
        for (const child of condition) {
          observe({ collection, where: child })
        }
        continue
      }
      const resolved = compileBranchProjectionPath({ allowMissingFields, collection, path, req })
      for (const locale of resolved.locales) {
        locales.add(locale)
      }
      if (
        resolved.kind === 'relationship' &&
        resolved.targets.length === 1 &&
        condition &&
        !Array.isArray(condition)
      ) {
        for (const value of Object.values(condition)) {
          if (isNestedRelationshipQuery(value) && !Object.hasOwn(value, 'relationTo')) {
            observe({ collection: resolved.targets[0]!, where: value })
          }
        }
      }
    }
  }
  observe({ collection, where })
  for (const item of typeof sort === 'string' ? [sort] : (sort ?? [])) {
    for (const locale of compileBranchProjectionPath({
      allowMissingFields,
      collection,
      path: item.replace(/^-/, ''),
      req,
    }).locales) {
      locales.add(locale)
    }
  }
  return [...locales]
}

const getProjectionSlug = ({
  collection,
  req,
}: {
  collection: string
  req: PayloadRequest
}): null | string => {
  const slug = req.payload.collections[collection]?.config.custom?.branchQueryStorage?.projection

  return typeof slug === 'string' ? slug : null
}

const assertID = ({ value }: { value: unknown }): BranchHeadID => {
  if (
    (typeof value === 'string' && value.length) ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value
  }

  throw new Error('Relationship query operands must be logical document IDs.')
}
