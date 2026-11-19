import type { Column } from 'drizzle-orm'

import { type FlattenedField, type Where } from 'payload'
import { fieldShouldBeLocalized, isNestedRelationshipQuery } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'

import { isUUIDType } from '../utilities/isUUIDType.js'
import { sanitizePathSegment } from '../utilities/sanitizePathSegment.js'

export type ScalarWhereField = {
  field: FlattenedField
  isLocalized?: boolean
  isUUID: boolean
  type: 'scalar'
}

type CollectionWhereField =
  | { field: FlattenedField; type: 'collectionQuery' | 'hasManySelect' | 'rowContains' }
  | ScalarWhereField

export type WherePathPlan = {
  columnPath: string
  fieldsByCollection: Map<string, CollectionWhereField>
  schemaPath: string
  type: 'collectionQuery' | 'hasManySelect' | 'invalid' | 'rowContains' | 'scalar'
}

export type PolymorphicJoinWherePlan = Map<string, WherePathPlan>

/**
 * Analyzes every leaf path in a polymorphic join where clause before SQL is built. Each plan entry
 * records the flattened column path, the compatible field shape for each target collection, and
 * whether the path uses a column, a has-many select value table, or nested rows. A field may be absent
 * from some target collections; those branches compare against SQL NULL or an empty JSON array.
 *
 * Paths are marked as invalid when their storage shapes conflict, have no matching field,
 * lack a required column, or collide after path flattening.
 *
 * @returns A plan keyed by each unique schema path in `where`.
 * @throws If a target collection or its mapped database table is not available in the adapter.
 */
export const createPolymorphicJoinWherePlan = ({
  adapter,
  collections,
  where,
}: {
  adapter: DrizzleAdapter
  collections: string[]
  where: Where
}): PolymorphicJoinWherePlan => {
  const collectionContexts = collections.map((collection) => {
    const collectionConfig = adapter.payload.collections[collection]?.config

    if (!collectionConfig) {
      throw new Error(`Unknown polymorphic join collection "${collection}"`)
    }

    const tableName = adapter.tableNameMap.get(toSnakeCase(collection))
    const table = tableName ? (adapter.tables[tableName] as GenericTable | undefined) : undefined

    if (!table) {
      throw new Error(`Polymorphic join collection "${collection}" has no database table`)
    }

    return { collection, collectionConfig, table, tableName }
  })
  const schemaPathsByColumnPath = new Map<string, Set<string>>()
  const entries = getWhereEntries(where)
  const schemaPaths = new Set(entries.map(([path]) => path))
  const rowContainsPaths = new Set(
    entries
      .filter(
        ([, condition]) =>
          !Array.isArray(condition) && isNestedRelationshipQuery(condition?.contains),
      )
      .map(([path]) => path),
  )

  for (const schemaPath of schemaPaths) {
    const columnPath = getColumnPath(schemaPath)
    const paths = schemaPathsByColumnPath.get(columnPath) ?? new Set<string>()

    paths.add(schemaPath)
    schemaPathsByColumnPath.set(columnPath, paths)
  }

  const plan: PolymorphicJoinWherePlan = new Map()

  for (const schemaPath of schemaPaths) {
    const columnPath = getColumnPath(schemaPath)
    const fieldsByCollection = new Map<string, CollectionWhereField>()
    let isFieldPresent = schemaPath === 'id' || schemaPath === 'relationTo'
    let hasManySelect = false
    let hasRowContains = false
    let hasCollectionQuery = false
    let hasUnsupportedFieldShape = false
    const columnQueryValueSignatures = new Set<string>()
    const collectionQueryValueSignatures = new Set<string>()

    for (const { collection, collectionConfig, table, tableName } of collectionContexts) {
      const fieldAtPath = resolveQueryFieldPath({
        adapter,
        flattenedFields: collectionConfig.flattenedFields,
        pathSegments: schemaPath.split('.'),
      })

      if (schemaPath === 'id') {
        const idColumn = table['id'] as Column | undefined

        if (!idColumn) {
          hasUnsupportedFieldShape = true
        } else {
          columnQueryValueSignatures.add(`id:${idColumn.getSQLType()}`)
          fieldsByCollection.set(collection, {
            type: 'scalar',
            field:
              fieldAtPath.status === 'field'
                ? fieldAtPath.field
                : ({
                    name: 'id',
                    type: isUUIDType(adapter.idType) ? 'text' : 'number',
                  } as FlattenedField),
            isUUID: fieldAtPath.status !== 'field' && isUUIDType(adapter.idType),
          })
        }

        continue
      }

      if (fieldAtPath.status !== 'field') {
        hasUnsupportedFieldShape ||= fieldAtPath.status === 'unsupported'
        continue
      }

      isFieldPresent = true

      if (
        (fieldAtPath.field.type === 'array' || fieldAtPath.field.type === 'blocks') &&
        rowContainsPaths.has(schemaPath) &&
        !fieldAtPath.requiresCollectionQuery
      ) {
        hasRowContains = true
        fieldsByCollection.set(collection, { type: 'rowContains', field: fieldAtPath.field })
        continue
      }

      if (fieldAtPath.requiresCollectionQuery) {
        const field = fieldAtPath.field
        const hasManyValues = 'hasMany' in field && field.hasMany
        const hasUnsupportedManyValues = hasManyValues && field.type !== 'select'
        const hasPolymorphicValues =
          (field.type === 'relationship' || field.type === 'upload') &&
          Array.isArray(field.relationTo)
        const isContainer = ['array', 'blocks', 'group', 'tab'].includes(field.type)

        if (hasUnsupportedManyValues || hasPolymorphicValues || isContainer) {
          hasUnsupportedFieldShape = true
          continue
        }

        hasCollectionQuery = true
        collectionQueryValueSignatures.add(
          `${hasManyValues ? 'many' : 'one'}:${getFieldQueryValueSignature({ field })}`,
        )
        fieldsByCollection.set(collection, { type: 'collectionQuery', field })
        continue
      }

      if (fieldAtPath.field.type === 'select' && fieldAtPath.field.hasMany) {
        if (fieldAtPath.pathHasLocalized) {
          hasUnsupportedFieldShape = true
          continue
        }

        hasManySelect = true
        fieldsByCollection.set(collection, {
          type: 'hasManySelect',
          field: fieldAtPath.field,
        })
        continue
      }

      const fieldTable = fieldAtPath.pathHasLocalized
        ? adapter.tables[`${tableName}${adapter.localesSuffix}`]
        : table
      const fieldColumn = fieldTable?.[columnPath] as Column | undefined

      if (!fieldColumn) {
        hasUnsupportedFieldShape = true
        continue
      }

      fieldsByCollection.set(collection, {
        type: 'scalar',
        field: fieldAtPath.field,
        ...(fieldAtPath.pathHasLocalized && { isLocalized: true }),
        isUUID: fieldColumn.columnType === 'PgUUID',
      })
      columnQueryValueSignatures.add(
        getFieldQueryValueSignature({ column: fieldColumn, field: fieldAtPath.field }),
      )
    }

    const isInvalid =
      !isFieldPresent ||
      hasUnsupportedFieldShape ||
      (hasManySelect && columnQueryValueSignatures.size > 0) ||
      (hasRowContains &&
        (hasManySelect || hasCollectionQuery || columnQueryValueSignatures.size > 0)) ||
      (hasCollectionQuery && (hasManySelect || columnQueryValueSignatures.size > 0)) ||
      collectionQueryValueSignatures.size > 1 ||
      columnQueryValueSignatures.size > 1

    let type: WherePathPlan['type'] = 'scalar'

    if (isInvalid) {
      type = 'invalid'
    } else if (hasRowContains) {
      type = 'rowContains'
    } else if (hasCollectionQuery) {
      type = 'collectionQuery'
    } else if (hasManySelect) {
      type = 'hasManySelect'
    }

    plan.set(schemaPath, {
      type,
      columnPath,
      fieldsByCollection,
      schemaPath,
    })
  }

  for (const schemaPaths of schemaPathsByColumnPath.values()) {
    const pathPlans = [...schemaPaths].map((schemaPath) => plan.get(schemaPath)!)
    const columnPlans = pathPlans.filter((pathPlan) => pathPlan.type !== 'collectionQuery')
    const collectionQueryPlans = pathPlans.filter((pathPlan) => pathPlan.type === 'collectionQuery')

    for (const collidingPlans of [columnPlans, collectionQueryPlans]) {
      if (collidingPlans.length > 1) {
        for (const pathPlan of collidingPlans) {
          pathPlan.type = 'invalid'
        }
      }
    }
  }

  return plan
}

const textQueryFieldTypes = new Set<FlattenedField['type']>([
  'code',
  'email',
  'slug',
  'text',
  'textarea',
])

const getFieldQueryValueSignature = ({
  column,
  field,
}: {
  column?: Column
  field: FlattenedField
}): string => {
  if (field.type === 'select' || field.type === 'radio') {
    const optionValues = field.options.map((option) =>
      typeof option === 'string' ? option : option.value,
    )

    return `${field.type}:${JSON.stringify(optionValues)}`
  }

  if (textQueryFieldTypes.has(field.type)) {
    return 'text'
  }

  return `${field.type}:${column?.getSQLType() ?? ''}`
}

const getWhereEntries = (where: Where): [string, Where[string]][] => {
  const entries: [string, Where[string]][] = []

  for (const key in where) {
    if (['AND', 'OR'].includes(key.toUpperCase())) {
      if (Array.isArray(where[key])) {
        for (const nestedWhere of where[key]) {
          entries.push(...getWhereEntries(nestedWhere))
        }
      }
    } else {
      entries.push([key, where[key]])
    }
  }

  return entries
}

const getColumnPath = (schemaPath: string): string =>
  schemaPath
    .split('.')
    .map((segment) => sanitizePathSegment(segment))
    .join('_')

type ResolvedQueryFieldPath =
  | {
      field: FlattenedField
      pathHasLocalized: boolean
      requiresCollectionQuery: boolean
      status: 'field'
    }
  | { status: 'missing' | 'unsupported' }

function resolveQueryFieldPath({
  adapter,
  flattenedFields,
  parentIsLocalized = false,
  pathSegments,
  requiresCollectionQuery = false,
}: {
  adapter: DrizzleAdapter
  flattenedFields: FlattenedField[]
  parentIsLocalized?: boolean
  pathSegments: string[]
  requiresCollectionQuery?: boolean
}): ResolvedQueryFieldPath {
  const [name, ...remainingSegments] = pathSegments
  const field = flattenedFields.find((field) => field.name === name)

  if (!field) {
    return { status: 'missing' }
  }

  const isFieldLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })
  const pathHasLocalized = parentIsLocalized || Boolean(field.localized)
  const localization = adapter.payload.config?.localization

  if (isFieldLocalized && localization && localization.localeCodes.includes(remainingSegments[0])) {
    remainingSegments.shift()
  }

  if (remainingSegments.length === 0) {
    return { field, pathHasLocalized, requiresCollectionQuery, status: 'field' }
  }

  const hasArrayOrBlock = field.type === 'array' || field.type === 'blocks'
  let nestedFields: FlattenedField[][]

  if ('flattenedFields' in field) {
    nestedFields = [field.flattenedFields]
  } else if (field.type === 'blocks') {
    nestedFields = field.blocks.map((block) =>
      typeof block === 'string'
        ? adapter.payload.blocks[block].flattenedFields
        : block.flattenedFields,
    )
  } else {
    return { status: 'unsupported' }
  }

  let firstFieldPath: ResolvedQueryFieldPath = { status: 'missing' }

  for (const flattenedFields of nestedFields) {
    const resolvedPath = resolveQueryFieldPath({
      adapter,
      flattenedFields,
      parentIsLocalized: pathHasLocalized,
      pathSegments: remainingSegments,
      requiresCollectionQuery: requiresCollectionQuery || hasArrayOrBlock,
    })

    if (resolvedPath.status === 'unsupported') {
      return resolvedPath
    }

    if (resolvedPath.status === 'field' && firstFieldPath.status === 'missing') {
      firstFieldPath = resolvedPath
    }
  }

  return firstFieldPath
}
