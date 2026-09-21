import type { Column, SQL } from 'drizzle-orm'

import { and, getTableName, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { type FlattenedField, QueryError, type Where } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type {
  PolymorphicJoinWherePlan,
  ScalarWhereField,
  WherePathPlan,
} from './createPolymorphicJoinWherePlan.js'

import { sanitizeQueryValue } from '../queries/sanitizeQueryValue.js'

const supportedJSONQueryOperators = new Set(['contains', 'equals', 'exists', 'in', 'like'])

type BuildPolymorphicJoinWhereArgs = {
  adapter: DrizzleAdapter
  collection: string
  table: GenericTable
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}

type ResolvedWherePath =
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
      pathPlan: WherePathPlan
      type: 'invalid'
    }

/**
 * Builds a where clause for one collection before the polymorphic branches are combined. A field
 * that is absent from this collection resolves to SQL NULL, and relationTo resolves to the current
 * collection slug.
 */
export const buildPolymorphicJoinWhere = ({
  adapter,
  collection,
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

    for (let payloadOperator of Object.keys(where[key])) {
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

      if (payloadOperator === '$raw') {
        if (typeof value !== 'string') {
          throw new QueryError([{ path: `${key}.${payloadOperator}` }])
        }

        constraints.push(sql.raw(value))
        continue
      }

      const { column, queryValueContext } = resolvedPath

      if (
        payloadOperator === 'like' &&
        (queryValueContext.field.type === 'number' ||
          queryValueContext.field.type === 'relationship' ||
          queryValueContext.field.type === 'upload' ||
          queryValueContext.isUUID)
      ) {
        payloadOperator = 'equals'
      }

      const sanitizedQueryValue = sanitizeQueryValue({
        adapter,
        field: queryValueContext.field,
        isUUID: queryValueContext.isUUID,
        operator: payloadOperator,
        relationOrPath: key,
        val: value,
      })

      if (sanitizedQueryValue === null || sanitizedQueryValue.columns) {
        throw new QueryError([{ path: `${key}.${originalOperator}` }])
      }

      payloadOperator = sanitizedQueryValue.operator
      value = sanitizedQueryValue.value

      if (!(payloadOperator in adapter.operators)) {
        throw new QueryError([{ path: `${key}.${originalOperator}` }])
      }

      const operator = adapter.operators[payloadOperator as keyof typeof adapter.operators]

      if (originalOperator === 'equals' && value === null) {
        constraints.push(isNull(column))
        continue
      }

      if (originalOperator === 'not_equals') {
        if (value === null) {
          constraints.push(isNotNull(column))
        } else {
          const notEqualsConstraint = or(isNull(column), operator(column, value))

          if (notEqualsConstraint) {
            constraints.push(notEqualsConstraint)
          }
        }
        continue
      }

      if (originalOperator === 'in' && Array.isArray(value) && value.includes(null)) {
        const nonNullValues = value.filter((item) => item !== null)
        const inConstraint = nonNullValues.length ? operator(column, nonNullValues) : undefined
        const nullAwareInConstraint = inConstraint
          ? or(isNull(column), inConstraint)
          : isNull(column)

        if (nullAwareInConstraint) {
          constraints.push(nullAwareInConstraint)
        }
        continue
      }

      if (payloadOperator === 'like' && typeof value === 'string') {
        const wordConstraints = value.split(' ').map((word) => operator(column, `%${word}%`))
        const wordCondition = and(...wordConstraints)

        if (wordCondition) {
          constraints.push(wordCondition)
        }
        continue
      }

      constraints.push(operator(column, value))
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

  if (pathPlan.type === 'hasManySelect') {
    const fieldContext = [...pathPlan.fieldsByCollection.values()].find(
      (field) => field.type === 'hasManySelect',
    )?.field

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
