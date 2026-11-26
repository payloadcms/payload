import type { Column, SQL } from 'drizzle-orm'

import { and, getTableName, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { type FlattenedField, type Operator, QueryError, type Where } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleResolvedOperator } from '../queries/operatorMap.js'
import type { DrizzleAdapter, GenericTable } from '../types.js'
import type {
  PolymorphicJoinWherePlan,
  ScalarWhereField,
  WherePathPlan,
} from './createPolymorphicJoinWherePlan.js'

import { buildOperatorConstraint } from '../queries/buildOperatorConstraint.js'
import { sanitizeQueryValue } from '../queries/sanitizeQueryValue.js'
import { buildPolymorphicJSONPathConstraint } from './buildPolymorphicJSONPathConstraint.js'

const supportedJSONQueryOperators = new Set(['contains', 'equals', 'exists', 'in', 'like'])

type BuildPolymorphicJoinWhereArgs = {
  adapter: DrizzleAdapter
  collection: string
  locale?: string
  shouldUseVersionTable?: boolean
  table: GenericTable
  where: Where
  wherePlan: PolymorphicJoinWherePlan
}

type ResolvedWherePath =
  | {
      column: Column | SQL
      fieldContext?: ScalarWhereField
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
  shouldUseVersionTable = false,
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
          shouldUseVersionTable,
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
      shouldUseVersionTable,
      table,
      wherePlan,
    })

    for (let payloadOperator of Object.keys(where[key])) {
      const originalOperator = payloadOperator as Operator
      let value = where[key][payloadOperator]

      if (resolvedPath.type === 'invalid') {
        throw new QueryError([{ path: `${key}.${payloadOperator}` }])
      }

      // `sanitizeQueryValue` only turns `contains` into a whole-value match for has-many selects, so
      // the single-select branch would match substrings (`available` inside `unavailable`). Use
      // whole-value matching on every branch. `like` has no whole-value equivalent.
      if (resolvedPath.pathPlan.type === 'mixedSelect') {
        if (payloadOperator === 'like' || payloadOperator === 'not_like') {
          throw new QueryError([{ path: `${key}.${payloadOperator}` }])
        }

        if (payloadOperator === 'contains') {
          payloadOperator = 'equals'
        }
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

        if (sanitizedQueryValue === null) {
          throw new QueryError([{ path: `${key}.${originalOperator}` }])
        }

        if (sanitizedQueryValue.columns) {
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

      if (payloadOperator === '$raw') {
        if (typeof value !== 'string') {
          throw new QueryError([{ path: `${key}.${payloadOperator}` }])
        }

        constraints.push(sql.raw(value))
        continue
      }

      const { column, fieldContext, queryValueContext } = resolvedPath

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

      if (sanitizedQueryValue === null) {
        throw new QueryError([{ path: `${key}.${originalOperator}` }])
      }

      if (sanitizedQueryValue.columns) {
        throw new QueryError([{ path: `${key}.${originalOperator}` }])
      }

      payloadOperator = sanitizedQueryValue.operator
      value = sanitizedQueryValue.value

      if (!(payloadOperator in adapter.operators)) {
        throw new QueryError([{ path: `${key}.${originalOperator}` }])
      }

      const resolvedOperator = payloadOperator as DrizzleResolvedOperator
      const operator = adapter.operators[resolvedOperator]
      const buildColumnConstraint = (constraintValue: unknown) => {
        if (!fieldContext) {
          return operator(column, constraintValue)
        }

        return buildOperatorConstraint({
          adapter,
          column,
          field: fieldContext.field,
          locale,
          originalOperator,
          path: key,
          resolvedOperator,
          value: constraintValue,
        })
      }

      if (originalOperator === 'equals' && value === null) {
        constraints.push(isNull(column))
        continue
      }

      if (originalOperator === 'not_equals') {
        if (value === null) {
          constraints.push(isNotNull(column))
        } else {
          const notEqualsConstraint = or(isNull(column), buildColumnConstraint(value))

          if (notEqualsConstraint) {
            constraints.push(notEqualsConstraint)
          }
        }
        continue
      }

      if (originalOperator === 'in' && Array.isArray(value) && value.includes(null)) {
        const nonNullValues = value.filter((item) => item !== null)
        const inConstraint = buildColumnConstraint(nonNullValues)
        const nullAwareInConstraint = or(isNull(column), inConstraint)

        if (nullAwareInConstraint) {
          constraints.push(nullAwareInConstraint)
        }
        continue
      }

      if (payloadOperator === 'like' && typeof value === 'string') {
        const wordConstraints = value.split(' ').map((word) => buildColumnConstraint(`%${word}%`))
        const wordCondition = and(...wordConstraints)

        if (wordCondition) {
          constraints.push(wordCondition)
        }
        continue
      }

      constraints.push(buildColumnConstraint(value))
    }
  }

  return and(...constraints)
}

const resolveWherePath = ({
  adapter,
  collection,
  schemaPath,
  shouldUseVersionTable,
  table,
  wherePlan,
}: {
  schemaPath: string
} & Omit<BuildPolymorphicJoinWhereArgs, 'locale' | 'where'>): ResolvedWherePath => {
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
      column: adapter.name === 'postgres' ? sql`cast(${collection} as text)` : sql`${collection}`,
      pathPlan,
      queryValueContext: {
        type: 'scalar',
        field: { name: 'relationTo', type: 'text' },
        isUUID: false,
      },
    }
  }

  const collectionFieldForBranch = pathPlan.fieldsByCollection.get(collection)

  if (pathPlan.type === 'jsonPath') {
    if (collectionFieldForBranch) {
      if (collectionFieldForBranch.type !== 'jsonPath') {
        return { type: 'invalid', pathPlan }
      }

      const { jsonColumnPath, jsonPathSegments } = collectionFieldForBranch
      const jsonColumn = table[
        shouldUseVersionTable ? `version_${jsonColumnPath}` : jsonColumnPath
      ] as Column | undefined

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
        shouldUseVersionTable,
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

  let column: Column | SQL = sql`null`

  if (fieldContext) {
    const columnName = shouldUseVersionTable
      ? `version_${pathPlan.columnPath}`
      : pathPlan.columnPath

    if (fieldContext.isLocalized) {
      column = adapter.tables[`${getTableName(table)}${adapter.localesSuffix}`][columnName]
    } else {
      const tableColumnName = shouldUseVersionTable && schemaPath === 'id' ? 'parent' : columnName

      column = table[tableColumnName]
    }
  }

  return {
    type: 'scalar',
    column,
    fieldContext,
    pathPlan,
    queryValueContext,
  }
}

const getHasManySelectExpression = ({
  adapter,
  collection,
  pathPlan,
  shouldUseVersionTable,
  table,
}: {
  adapter: DrizzleAdapter
  collection: string
  pathPlan: WherePathPlan
  shouldUseVersionTable?: boolean
  table: GenericTable
}): string => {
  if (pathPlan.fieldsByCollection.get(collection)?.type !== 'hasManySelect') {
    return adapter.name === 'postgres' ? `'[]'::jsonb` : `'[]'`
  }

  const selectTablePath = pathPlan.schemaPath
    .split('.')
    .map((pathSegment) => toSnakeCase(pathSegment))
    .join('_')
  const valuesTableName = adapter.tableNameMap.get(
    shouldUseVersionTable
      ? `${getTableName(table)}_version_${selectTablePath}`
      : `${toSnakeCase(collection)}_${selectTablePath}`,
  )

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
