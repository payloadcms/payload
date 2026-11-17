import type { Column } from 'drizzle-orm'

import { type FlattenedField, getFieldByPath, type Where } from 'payload'
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
  | { field: FlattenedField; type: 'hasManySelect' | 'nested' }
  | ScalarWhereField

export type WherePathPlan = {
  columnPath: string
  fieldsByCollection: Map<string, CollectionWhereField>
  schemaPath: string
  type: 'hasManySelect' | 'invalid' | 'nested' | 'scalar'
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
  const schemaPaths = new Set(getWhereSchemaPaths(where))

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
    let hasNestedField = false
    let hasUnsupportedFieldShape = false
    const scalarQueryValueSignatures = new Set<string>()
    const nestedQueryValueSignatures = new Set<string>()

    for (const { collection, collectionConfig, table, tableName } of collectionContexts) {
      const fieldAtPath = getFieldAtQueryPath({
        adapter,
        flattenedFields: collectionConfig.flattenedFields,
        path: schemaPath,
      })

      if (schemaPath === 'id') {
        const idColumn = table['id'] as Column | undefined

        if (!idColumn) {
          hasUnsupportedFieldShape = true
        } else {
          scalarQueryValueSignatures.add(`id:${idColumn.getSQLType()}`)
          fieldsByCollection.set(collection, {
            type: 'scalar',
            field:
              fieldAtPath?.field ??
              ({
                name: 'id',
                type: isUUIDType(adapter.idType) ? 'text' : 'number',
              } as FlattenedField),
            isUUID: !fieldAtPath && isUUIDType(adapter.idType),
          })
        }

        continue
      }

      if (!fieldAtPath) {
        if (
          pathHasUnsupportedNestedContainer({
            flattenedFields: collectionConfig.flattenedFields,
            path: schemaPath,
          })
        ) {
          hasUnsupportedFieldShape = true
        }

        continue
      }

      isFieldPresent = true

      if (
        pathHasArrayOrBlock({ flattenedFields: collectionConfig.flattenedFields, path: schemaPath })
      ) {
        hasNestedField = true
        nestedQueryValueSignatures.add(
          `${'hasMany' in fieldAtPath.field && fieldAtPath.field.hasMany ? 'many' : 'one'}:${getScalarQueryValueSignature({ field: fieldAtPath.field })}`,
        )
        fieldsByCollection.set(collection, { type: 'nested', field: fieldAtPath.field })
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
      scalarQueryValueSignatures.add(
        getScalarQueryValueSignature({ column: fieldColumn, field: fieldAtPath.field }),
      )
    }

    const hasColumnPathCollision = (schemaPathsByColumnPath.get(columnPath)?.size ?? 0) > 1
    const isInvalid =
      hasColumnPathCollision ||
      !isFieldPresent ||
      hasUnsupportedFieldShape ||
      (hasManySelect && scalarQueryValueSignatures.size > 0) ||
      (hasNestedField && (hasManySelect || scalarQueryValueSignatures.size > 0)) ||
      nestedQueryValueSignatures.size > 1 ||
      scalarQueryValueSignatures.size > 1

    let type: WherePathPlan['type'] = 'scalar'

    if (isInvalid) {
      type = 'invalid'
    } else if (hasNestedField) {
      type = 'nested'
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

  return plan
}

const textQueryFieldTypes = new Set<FlattenedField['type']>([
  'code',
  'email',
  'slug',
  'text',
  'textarea',
])

const getScalarQueryValueSignature = ({
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

const getWhereSchemaPaths = (where: Where): string[] => {
  const paths: string[] = []

  for (const key in where) {
    if (['AND', 'OR'].includes(key.toUpperCase())) {
      if (Array.isArray(where[key])) {
        for (const nestedWhere of where[key]) {
          paths.push(...getWhereSchemaPaths(nestedWhere))
        }
      }
    } else {
      paths.push(key)
    }
  }

  return paths
}

const getColumnPath = (schemaPath: string): string =>
  schemaPath
    .split('.')
    .map((segment) => sanitizePathSegment(segment))
    .join('_')

const pathHasArrayOrBlock = ({
  flattenedFields,
  path,
}: {
  flattenedFields: FlattenedField[]
  path: string
}) => {
  const pathSegments = path.split('.')

  for (let segmentIndex = 1; segmentIndex < pathSegments.length; segmentIndex++) {
    const fieldAtParentPath = getFieldByPath({
      fields: flattenedFields,
      path: pathSegments.slice(0, segmentIndex).join('.'),
    })

    if (fieldAtParentPath?.field.type === 'array' || fieldAtParentPath?.field.type === 'blocks') {
      return true
    }
  }

  return false
}

const pathHasUnsupportedNestedContainer = ({
  flattenedFields,
  path,
}: {
  flattenedFields: FlattenedField[]
  path: string
}) => {
  const pathSegments = path.split('.')

  for (let segmentIndex = 1; segmentIndex < pathSegments.length; segmentIndex++) {
    const fieldAtParentPath = getFieldByPath({
      fields: flattenedFields,
      path: pathSegments.slice(0, segmentIndex).join('.'),
    })

    if (!fieldAtParentPath) {
      return false
    }

    if (!['array', 'blocks', 'group', 'tab'].includes(fieldAtParentPath.field.type)) {
      return true
    }
  }

  return false
}

function getFieldAtQueryPath({
  adapter,
  flattenedFields,
  path,
}: {
  adapter: DrizzleAdapter
  flattenedFields: FlattenedField[]
  path: string
}): { field: FlattenedField; pathHasLocalized: boolean } | undefined {
  const [name, ...segments] = path.split('.')
  const field = flattenedFields.find((field) => field.name === name)

  if (!field) {
    return undefined
  }

  if (segments.length === 0) {
    return { field, pathHasLocalized: Boolean(field.localized) }
  }

  let nestedFields: FlattenedField[][] = []

  if ('flattenedFields' in field) {
    nestedFields = [field.flattenedFields]
  } else if (field.type === 'blocks') {
    nestedFields = field.blocks.map((block) =>
      typeof block === 'string'
        ? adapter.payload.blocks[block].flattenedFields
        : block.flattenedFields,
    )
  }

  for (const flattenedFields of nestedFields) {
    const nestedField = getFieldAtQueryPath({ adapter, flattenedFields, path: segments.join('.') })

    if (nestedField) {
      return {
        field: nestedField.field,
        pathHasLocalized: Boolean(field.localized) || nestedField.pathHasLocalized,
      }
    }
  }

  return undefined
}
