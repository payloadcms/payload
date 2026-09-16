import type { Column, SQL } from 'drizzle-orm'

import { and, getTableName, or, sql } from 'drizzle-orm'
import { type FlattenedField, QueryError, type Where } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinStorageChain } from './createPolymorphicJoinStorageChain.js'
import type {
  PolymorphicJoinWherePlan,
  ScalarWhereField,
  WherePathPlan,
} from './createPolymorphicJoinWherePlan.js'

import { sanitizeQueryValue } from '../queries/sanitizeQueryValue.js'
import { buildPolymorphicJoinColumnConstraint } from './buildPolymorphicJoinColumnConstraint.js'
import {
  buildPolymorphicJoinAbsentPathConstraint,
  buildPolymorphicJoinSeparateRowsConstraint,
} from './buildPolymorphicJoinSeparateRowsConstraint.js'
import { buildPolymorphicJSONPathConstraint } from './buildPolymorphicJSONPathConstraint.js'

const supportedJSONQueryOperators = new Set(['contains', 'equals', 'exists', 'in', 'like'])

type BuildPolymorphicJoinWhereArgs = {
  adapter: DrizzleAdapter
  collection: string
  locale?: string
  table: GenericTable
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}

type ResolvedWherePath =
  | {
      /** Undefined when the path is absent from the current collection. */
      chain: PolymorphicJoinStorageChain | undefined
      field: FlattenedField | undefined
      pathPlan: WherePathPlan
      type: 'separateRows'
    }
  | {
      column: Column
      pathPlan: WherePathPlan
      queryValueContext: ScalarWhereField
      type: 'scalar'
    }
  | {
      fieldContext: FlattenedField
      jsonExpression: string
      pathPlan: WherePathPlan
      type: 'hasManySelect'
    }
  | {
      jsonColumnName: string | undefined
      jsonPathSegments: string[]
      pathPlan: WherePathPlan
      type: 'jsonPath'
    }
  | {
      pathPlan: WherePathPlan
      type: 'invalid'
    }

/**
 * Builds a where clause for one collection before the polymorphic branches are combined. A field
 * that is absent from this collection resolves to SQL NULL, a `json` sub-path that is absent
 * resolves to a boolean constant, and relationTo resolves to the current collection slug.
 */
export const buildPolymorphicJoinWhere = ({
  adapter,
  collection,
  locale,
  table,
  where,
  wherePlan,
}: BuildPolymorphicJoinWhereArgs): SQL | undefined => {
  const constraints: SQL[] = []

  for (const key in where) {
    if (['AND', 'OR'].includes(key.toUpperCase())) {
      if (!Array.isArray(where[key])) {
        throw new QueryError([{ path: key }])
      }

      const combine = key.toUpperCase() === 'AND' ? and : or
      const nestedConstraints = where[key].map((nestedWhere) =>
        buildPolymorphicJoinWhere({
          adapter,
          collection,
          locale,
          table,
          where: nestedWhere,
          wherePlan,
        }),
      )
      const nestedCondition = combine(...nestedConstraints)

      if (nestedCondition) {
        constraints.push(nestedCondition)
      }

      continue
    }

    const resolvedPath = resolveWherePath({
      adapter,
      collection,
      schemaPath: key,
      table,
      wherePlan,
    })

    for (const payloadOperator of Object.keys(where[key])) {
      const originalOperator = payloadOperator
      let value = where[key][payloadOperator]

      if (resolvedPath.type === 'invalid') {
        throw new QueryError([{ path: `${key}.${payloadOperator}` }])
      }

      if (resolvedPath.type === 'hasManySelect') {
        if (!supportedJSONQueryOperators.has(payloadOperator)) {
          throw new QueryError([{ path: `${key}.${payloadOperator}` }])
        }

        const sanitizedQueryValue = sanitizeQueryValue({
          adapter,
          field: resolvedPath.fieldContext,
          isUUID: false,
          operator: payloadOperator,
          relationOrPath: key,
          val: value,
        })

        if (sanitizedQueryValue === null || sanitizedQueryValue.columns) {
          throw new QueryError([{ path: `${key}.${originalOperator}` }])
        }

        value = sanitizedQueryValue.value

        if (payloadOperator === 'in' && Array.isArray(value) && value.length === 0) {
          constraints.push(sql.raw('false'))
          continue
        }

        const jsonQueryOperator =
          payloadOperator === 'exists' ? 'exists' : sanitizedQueryValue.operator

        constraints.push(
          sql.raw(
            adapter.createJSONQuery({
              column: resolvedPath.jsonExpression,
              operator: jsonQueryOperator,
              pathSegments: [resolvedPath.pathPlan.columnPath],
              value,
            }),
          ),
        )
        continue
      }

      if (resolvedPath.type === 'jsonPath') {
        constraints.push(
          buildPolymorphicJSONPathConstraint({
            adapter,
            jsonColumnName: resolvedPath.jsonColumnName,
            operator: payloadOperator,
            path: `${key}.${originalOperator}`,
            pathSegments: resolvedPath.jsonPathSegments,
            value,
          }),
        )
        continue
      }

      if (resolvedPath.type === 'separateRows') {
        const { chain, field } = resolvedPath

        constraints.push(
          chain && field
            ? buildPolymorphicJoinSeparateRowsConstraint({
                adapter,
                chain,
                errorPath: `${key}.${originalOperator}`,
                field,
                locale,
                operator: payloadOperator,
                parentTable: table,
                schemaPath: key,
                value,
              })
            : buildPolymorphicJoinAbsentPathConstraint({ operator: payloadOperator, value }),
        )
        continue
      }

      if (payloadOperator === '$raw') {
        if (typeof value !== 'string') {
          throw new QueryError([{ path: `${key}.${payloadOperator}` }])
        }

        constraints.push(sql.raw(value))
        continue
      }

      constraints.push(
        buildPolymorphicJoinColumnConstraint({
          adapter,
          column: resolvedPath.column,
          errorPath: `${key}.${originalOperator}`,
          field: resolvedPath.queryValueContext.field,
          isUUID: resolvedPath.queryValueContext.isUUID,
          operator: payloadOperator,
          schemaPath: key,
          value,
        }),
      )
    }
  }

  return and(...constraints)
}

const resolveWherePath = ({
  adapter,
  collection,
  schemaPath,
  table,
  wherePlan,
}: {
  schemaPath: string
} & Omit<BuildPolymorphicJoinWhereArgs, 'where'>): ResolvedWherePath => {
  const pathPlan = wherePlan.get(schemaPath)

  if (!pathPlan) {
    throw new QueryError([{ path: schemaPath }])
  }

  if (pathPlan.type === 'invalid') {
    return { type: 'invalid', pathPlan }
  }

  if (schemaPath === 'relationTo') {
    return {
      type: 'scalar',
      column: sql`${collection}` as unknown as Column,
      pathPlan,
      queryValueContext: {
        type: 'scalar',
        field: { name: 'relationTo', type: 'text' },
        isUUID: false,
      },
    }
  }

  const collectionFieldForBranch = pathPlan.fieldsByCollection.get(collection)

  if (pathPlan.type === 'separateRows') {
    if (collectionFieldForBranch) {
      if (collectionFieldForBranch.type !== 'separateRows') {
        return { type: 'invalid', pathPlan }
      }

      return {
        type: 'separateRows',
        chain: collectionFieldForBranch.chain,
        field: collectionFieldForBranch.field,
        pathPlan,
      }
    }

    // No entry for this collection means the path is absent here, so it reads as SQL NULL.
    return { type: 'separateRows', chain: undefined, field: undefined, pathPlan }
  }

  if (pathPlan.type === 'jsonPath') {
    if (collectionFieldForBranch) {
      if (collectionFieldForBranch.type !== 'jsonPath') {
        return { type: 'invalid', pathPlan }
      }

      const { jsonColumnPath, jsonPathSegments } = collectionFieldForBranch
      const jsonColumn = table[jsonColumnPath] as Column | undefined

      if (!jsonColumn) {
        return { type: 'invalid', pathPlan }
      }

      return {
        type: 'jsonPath',
        jsonColumnName: jsonColumn.name,
        jsonPathSegments: [jsonColumnPath, ...jsonPathSegments],
        pathPlan,
      }
    }

    // No entry for this collection means the `json` column is absent here, so the sub-path reads as
    // SQL NULL and the constraint resolves from the operator alone.
    return { type: 'jsonPath', jsonColumnName: undefined, jsonPathSegments: [], pathPlan }
  }

  // A `mixedSelect` path is a has-many select in some target collections and a single select column
  // in others. Each branch is resolved with its own storage handler: has-many branches use the JSON
  // value-table subquery, single-select branches fall through to the scalar handler below.
  const useHasManySelectBranch =
    pathPlan.type === 'hasManySelect' ||
    (pathPlan.type === 'mixedSelect' && collectionFieldForBranch?.type === 'hasManySelect')

  if (useHasManySelectBranch) {
    const fieldContext =
      collectionFieldForBranch?.type === 'hasManySelect'
        ? collectionFieldForBranch.field
        : [...pathPlan.fieldsByCollection.values()].find((field) => field.type === 'hasManySelect')
            ?.field

    if (!fieldContext) {
      return { type: 'invalid', pathPlan }
    }

    return {
      type: 'hasManySelect',
      fieldContext,
      jsonExpression: getHasManySelectExpression({
        adapter,
        collection,
        pathPlan,
        table,
      }),
      pathPlan,
    }
  }

  const collectionField = pathPlan.fieldsByCollection.get(collection)
  const fieldContext = collectionField?.type === 'scalar' ? collectionField : undefined
  const queryValueContext =
    fieldContext ??
    [...pathPlan.fieldsByCollection.values()].find(
      (field): field is ScalarWhereField => field.type === 'scalar',
    )

  if (!queryValueContext) {
    return { type: 'invalid', pathPlan }
  }

  return {
    type: 'scalar',
    column: fieldContext ? table[pathPlan.columnPath] : (sql`null` as unknown as Column),
    pathPlan,
    queryValueContext,
  }
}

const getHasManySelectExpression = ({
  adapter,
  collection,
  pathPlan,
  table,
}: {
  adapter: DrizzleAdapter
  collection: string
  pathPlan: WherePathPlan
  table: GenericTable
}): string => {
  if (pathPlan.fieldsByCollection.get(collection)?.type !== 'hasManySelect') {
    return adapter.name === 'postgres' ? `'[]'::jsonb` : `'[]'`
  }

  const selectTablePath = pathPlan.schemaPath
    .split('.')
    .map((pathSegment) => toSnakeCase(pathSegment))
    .join('_')
  const valuesTableName = adapter.tableNameMap.get(`${toSnakeCase(collection)}_${selectTablePath}`)

  if (!valuesTableName) {
    throw new Error(
      `Polymorphic join collection "${collection}" has no value table for "${pathPlan.schemaPath}"`,
    )
  }

  let qualifiedValuesTableName = valuesTableName
  let parentTableName = getTableName(table)

  if (adapter.schemaName) {
    qualifiedValuesTableName = `"${adapter.schemaName}"."${valuesTableName}"`
    parentTableName = `"${adapter.schemaName}"."${parentTableName}"`
  }

  if (adapter.name === 'postgres') {
    return `(select coalesce(jsonb_agg(${qualifiedValuesTableName}.value), '[]'::jsonb) from ${qualifiedValuesTableName} where ${qualifiedValuesTableName}.parent_id = ${parentTableName}.id)`
  }

  return `(select json_group_array(${qualifiedValuesTableName}.value) from ${qualifiedValuesTableName} where ${qualifiedValuesTableName}.parent_id = ${parentTableName}.id)`
}
