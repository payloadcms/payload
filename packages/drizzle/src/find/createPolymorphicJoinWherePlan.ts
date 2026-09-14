import type { Column } from 'drizzle-orm'

import { type FlattenedField, getFieldByPath, type Where } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'

import { isUUIDType } from '../utilities/isUUIDType.js'
import { sanitizePathSegment } from '../utilities/sanitizePathSegment.js'

export type ScalarWhereField = {
  field: FlattenedField
  isUUID: boolean
  type: 'scalar'
}

type CollectionWhereField = { field: FlattenedField; type: 'hasManySelect' } | ScalarWhereField

export type WherePathPlan = {
  columnPath: string
  fieldsByCollection: Map<string, CollectionWhereField>
  schemaPath: string
  type: 'hasManySelect' | 'invalid' | 'mixedSelect' | 'scalar'
}

export type PolymorphicJoinWherePlan = Map<string, WherePathPlan>

/**
 * Analyzes every leaf path in a polymorphic join where clause before SQL is built. Each plan entry
 * records the flattened column path, the compatible field shape for each target collection, and
 * whether the path uses a scalar column or a has-many select value table. A field may be absent
 * from some target collections; those branches compare against SQL NULL or an empty JSON array.
 *
 * Paths are marked as invalid when their storage shapes conflict, require localized or separate-row
 * traversal, have no matching field, lack a required column, or collide after path flattening.
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

    return { collection, collectionConfig, table }
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
    let hasScalarSelect = false
    let hasScalarNonOption = false
    let hasUnsupportedFieldShape = false
    const scalarQueryValueSignatures = new Set<string>()
    const optionSignatures = new Set<string>()

    for (const { collection, collectionConfig, table } of collectionContexts) {
      const fieldAtPath = getFieldByPath({
        fields: collectionConfig.flattenedFields,
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
            fields: collectionConfig.flattenedFields,
            path: schemaPath,
          })
        ) {
          hasUnsupportedFieldShape = true
        }

        continue
      }

      isFieldPresent = true

      if (
        fieldAtPath.pathHasLocalized ||
        pathHasSeparateRows({ fields: collectionConfig.flattenedFields, path: schemaPath })
      ) {
        hasUnsupportedFieldShape = true
        continue
      }

      if (fieldAtPath.field.type === 'select' && fieldAtPath.field.hasMany) {
        hasManySelect = true
        optionSignatures.add(getOptionSignature(fieldAtPath.field))
        fieldsByCollection.set(collection, {
          type: 'hasManySelect',
          field: fieldAtPath.field,
        })
        continue
      }

      const fieldColumn = table[columnPath] as Column | undefined

      if (!fieldColumn) {
        hasUnsupportedFieldShape = true
        continue
      }

      if (isOptionField(fieldAtPath.field)) {
        hasScalarSelect = true
        optionSignatures.add(getOptionSignature(fieldAtPath.field))
      } else {
        hasScalarNonOption = true
      }

      fieldsByCollection.set(collection, {
        type: 'scalar',
        field: fieldAtPath.field,
        isUUID: fieldColumn.columnType === 'PgUUID',
      })
      scalarQueryValueSignatures.add(
        getScalarQueryValueSignature({ column: fieldColumn, field: fieldAtPath.field }),
      )
    }

    const hasColumnPathCollision = (schemaPathsByColumnPath.get(columnPath)?.size ?? 0) > 1
    const isBaseInvalid = hasColumnPathCollision || !isFieldPresent || hasUnsupportedFieldShape

    // A field can be stored as a has-many select (separate value rows) in one target collection and
    // as a single select column in another. Both compile per-branch with their own storage handler,
    // so the mix is safe as long as every target is option-based with identical option values. Any
    // shape mismatch outside that (e.g. text vs number) stays invalid to avoid unsound coercion.
    const isMixedSelect =
      !isBaseInvalid &&
      hasManySelect &&
      hasScalarSelect &&
      !hasScalarNonOption &&
      optionSignatures.size === 1

    const isInvalid =
      isBaseInvalid ||
      (!isMixedSelect &&
        ((hasManySelect && scalarQueryValueSignatures.size > 0) ||
          scalarQueryValueSignatures.size > 1))

    plan.set(schemaPath, {
      type: isInvalid
        ? 'invalid'
        : isMixedSelect
          ? 'mixedSelect'
          : hasManySelect
            ? 'hasManySelect'
            : 'scalar',
      columnPath,
      fieldsByCollection,
      schemaPath,
    })
  }

  return plan
}

const textQueryFieldTypes = new Set<FlattenedField['type']>(['code', 'email', 'text', 'textarea'])

const isOptionField = (field: FlattenedField): boolean =>
  field.type === 'select' || field.type === 'radio'

const getOptionSignature = (field: FlattenedField): string => {
  const optionValues =
    'options' in field
      ? field.options.map((option) => (typeof option === 'string' ? option : option.value))
      : []

  return `${field.type}:${JSON.stringify(optionValues)}`
}

const getScalarQueryValueSignature = ({
  column,
  field,
}: {
  column: Column
  field: FlattenedField
}): string => {
  if (field.type === 'radio' || field.type === 'select') {
    return getOptionSignature(field)
  }

  if (textQueryFieldTypes.has(field.type)) {
    return 'text'
  }

  return `${field.type}:${column.getSQLType()}`
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

const pathHasSeparateRows = ({ fields, path }: { fields: FlattenedField[]; path: string }) => {
  const pathSegments = path.split('.')

  for (let segmentIndex = 1; segmentIndex < pathSegments.length; segmentIndex++) {
    const fieldAtParentPath = getFieldByPath({
      fields,
      path: pathSegments.slice(0, segmentIndex).join('.'),
    })

    if (fieldAtParentPath?.field.type === 'array' || fieldAtParentPath?.field.type === 'blocks') {
      return true
    }
  }

  return false
}

const pathHasUnsupportedNestedContainer = ({
  fields,
  path,
}: {
  fields: FlattenedField[]
  path: string
}) => {
  const pathSegments = path.split('.')

  for (let segmentIndex = 1; segmentIndex < pathSegments.length; segmentIndex++) {
    const fieldAtParentPath = getFieldByPath({
      fields,
      path: pathSegments.slice(0, segmentIndex).join('.'),
    })

    if (!fieldAtParentPath) {
      return false
    }

    if (!['group', 'tab'].includes(fieldAtParentPath.field.type)) {
      return true
    }
  }

  return false
}
