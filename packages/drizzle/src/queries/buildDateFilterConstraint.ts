import type { Column, SQL, Table } from 'drizzle-orm'
import type { FlattenedField } from 'payload'
import type { ResolvedDateFilterPlan, ResolvedDateFilterTarget } from 'payload/shared'

import { aliasedTable, and, exists, notExists, or, sql } from 'drizzle-orm'
import { APIError } from 'payload'
import { getDateOnlyComparison } from 'payload/shared'

import type { DrizzleAdapter } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'
import type { DrizzleResolvedOperator } from './operatorMap.js'

import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { addJoinTable } from './addJoinTable.js'
import { resolveOperatorConstraint } from './buildOperatorConstraint.js'
import { getTableColumnFromPath } from './getTableColumnFromPath.js'

export const buildDateComparisonConstraint = ({
  adapter,
  column,
  locale,
  path,
  plan,
  target,
}: {
  adapter: DrizzleAdapter
  column: Column | SQL
  locale?: string
  path: string
  plan: ResolvedDateFilterPlan
  target: ResolvedDateFilterTarget
}): SQL | undefined => {
  return resolveDateComparisonConstraint({
    adapter,
    column,
    locale,
    path,
    plan,
    target,
  })?.constraint
}

const resolveDateComparisonConstraint = ({
  adapter,
  column,
  isJoined = false,
  locale,
  path,
  plan,
  target,
}: {
  adapter: DrizzleAdapter
  column: Column | SQL
  isJoined?: boolean
  locale?: string
  path: string
  plan: ResolvedDateFilterPlan
  target: ResolvedDateFilterTarget
}): { constraint: SQL; isNegated: boolean } | undefined => {
  if (plan.input.kind !== 'calendarDay') {
    return undefined
  }

  const { context, replacement } = resolveOperatorConstraint({
    args: {
      adapter,
      column,
      field: target.field,
      locale,
      originalOperator: plan.operator,
      path,
      resolvedOperator: plan.operator as DrizzleResolvedOperator,
      value: plan.input.serialized,
    },
  })

  if (replacement) {
    return { constraint: replacement, isNegated: false }
  }

  const isNegated = isJoined && plan.operator === 'not_equals'

  const comparison = getDateOnlyComparison({
    date: context.value,
    operator: isNegated ? 'equals' : plan.operator,
    timezone: plan.timezone,
  })

  if (!comparison) {
    return {
      constraint: adapter.operators[plan.operator](context.column, context.value),
      isNegated: false,
    }
  }

  const constraints = comparison.constraints.map((constraint) =>
    adapter.operators[constraint.operator](context.column, constraint.value.toISOString()),
  )

  if (!isNegated && comparison.includesNull) {
    constraints.unshift(adapter.operators.isNull(context.column, null))
  }

  if (constraints.length === 1) {
    return { constraint: constraints[0]!, isNegated }
  }

  const constraint = comparison.combination === 'and' ? and(...constraints) : or(...constraints)

  return constraint ? { constraint, isNegated } : undefined
}

export const buildDateFilterConstraint = ({
  adapter,
  aliasTable,
  fields,
  joins,
  parentIsLocalized,
  path,
  plan,
  selectLocale,
  tableName,
}: {
  adapter: DrizzleAdapter
  aliasTable?: Table
  fields: FlattenedField[]
  joins: BuildQueryJoinAliases
  parentIsLocalized: boolean
  path: string
  plan: ResolvedDateFilterPlan
  selectLocale?: boolean
  tableName: string
}): SQL => {
  const targetConstraints = plan.targets.map((target) =>
    buildDateFilterTargetConstraint({
      adapter,
      aliasTable,
      fields,
      joins,
      parentIsLocalized,
      path,
      plan,
      selectLocale,
      tableName,
      target,
    }),
  )

  return (plan.operator === 'not_equals' ? and(...targetConstraints) : or(...targetConstraints))!
}

export const getDateOnlyJSONPaths = ({
  pathSegments: resolvedPathSegments,
  target,
}: {
  pathSegments: string[]
  target: ResolvedDateFilterTarget
}): { pathSegments: string[]; repeatedPaths: string[] } => {
  const pathSegments: string[] = []
  const repeatedPaths: string[] = []
  const lineage = target.lineage.slice(target.lineage.length - resolvedPathSegments.length)

  for (const [index, segment] of lineage.entries()) {
    pathSegments.push(segment.name)

    if (index > 0 && segment.locale) {
      pathSegments.push(segment.locale)
    }

    if (index > 0 && (segment.type === 'array' || segment.type === 'blocks')) {
      repeatedPaths.push(pathSegments.slice(1).join('.'))
    }
  }

  return { pathSegments, repeatedPaths }
}

const buildDateFilterTargetConstraint = ({
  adapter,
  aliasTable,
  fields,
  joins,
  parentIsLocalized,
  path,
  plan,
  selectLocale,
  tableName,
  target,
}: {
  adapter: DrizzleAdapter
  aliasTable?: Table
  fields: FlattenedField[]
  joins: BuildQueryJoinAliases
  parentIsLocalized: boolean
  path: string
  plan: ResolvedDateFilterPlan
  selectLocale?: boolean
  tableName: string
  target: ResolvedDateFilterTarget
}): SQL => {
  const targetJoins: BuildQueryJoinAliases = []
  const outerTable = aliasTable ?? aliasedTable(adapter.tables[tableName], tableName)
  const targetPath = getTableColumnFromPath({
    adapter,
    aliasTable: outerTable,
    collectionPath: path,
    fields,
    joins: targetJoins,
    locale: plan.requestLocale,
    parentIsLocalized,
    pathSegments: target.lineage.map(({ name }) => name),
    selectFields: {},
    selectLocale,
    tableName,
    target,
    value: plan.input.kind === 'calendarDay' ? plan.input.serialized : undefined,
  })
  const column =
    targetPath.rawColumn ||
    (tableName === getNameFromDrizzleTable(targetPath.table)
      ? outerTable[targetPath.columnName]
      : targetPath.table[targetPath.columnName])
  const pathConstraints = targetPath.constraints.map(({ columnName, table, value }) =>
    adapter.operators.equals(table[columnName], value),
  )

  if (adapter.blocksAsJSON && targetPath.field.type === 'blocks') {
    const resolvedPathSegments = targetPath.pathSegments ?? target.lineage.map(({ name }) => name)
    const isNegatedAcrossRepeatedAncestor =
      plan.operator === 'not_equals' &&
      hasRepeatedAncestorOutsideJSONColumn({ resolvedPathSegments, target })

    const comparison = getDateOnlyJSONComparisonFromPlan({
      operator: isNegatedAcrossRepeatedAncestor ? 'equals' : plan.operator,
      plan,
    })

    if (!comparison) {
      throw new APIError(`Could not build the calendar-day comparison for "${path}".`)
    }

    const { pathSegments, repeatedPaths } = getDateOnlyJSONPaths({
      pathSegments: resolvedPathSegments,
      target,
    })

    const jsonConstraint = sql.raw(
      adapter.createJSONQuery({
        column,
        operator: comparison.operator,
        pathSegments,
        treatAsArray: repeatedPaths,
        treatRootAsArray: true,
        value: comparison.value,
      }),
    )

    if (isNegatedAcrossRepeatedAncestor) {
      return buildJoinedDateOnlySubquery({
        adapter,
        dateConstraint: jsonConstraint,
        isNegated: true,
        joins: targetJoins,
        pathConstraints,
      })
    }

    for (const targetJoin of targetJoins) {
      addJoinTable({
        type: targetJoin.type,
        condition: targetJoin.condition,
        isOneToMany: targetJoin.isOneToMany,
        joins,
        queryPath: targetJoin.queryPath,
        sourceTableName: targetJoin.sourceTableName,
        table: targetJoin.table,
      })
    }

    return and(...pathConstraints, jsonConstraint)!
  }

  const resolvedDateConstraint = resolveDateComparisonConstraint({
    adapter,
    column,
    isJoined: target.lineage.some(({ isRepeated }) => isRepeated),
    locale: plan.requestLocale,
    path,
    plan,
    target,
  })

  if (!resolvedDateConstraint) {
    throw new APIError(`Could not build the calendar-day comparison for "${path}".`)
  }

  if (targetJoins.length > 0) {
    return buildJoinedDateOnlySubquery({
      adapter,
      dateConstraint: resolvedDateConstraint.constraint,
      isNegated: resolvedDateConstraint.isNegated,
      joins: targetJoins,
      pathConstraints,
    })
  }

  return and(...pathConstraints, resolvedDateConstraint.constraint)!
}

const buildJoinedDateOnlySubquery = ({
  adapter,
  dateConstraint,
  isNegated,
  joins,
  pathConstraints,
}: {
  adapter: DrizzleAdapter
  dateConstraint: SQL
  isNegated: boolean
  joins: BuildQueryJoinAliases
  pathConstraints: SQL[]
}): SQL => {
  const [firstJoin, ...remainingJoins] = joins

  if (!firstJoin) {
    throw new APIError('Could not resolve the joined table for a date-only filter.')
  }

  // Drizzle's PostgreSQL and SQLite query builders have incompatible overloads despite sharing
  // this runtime API.
  // oxlint-disable-next-line typescript/no-explicit-any
  let matchingRows = (adapter.drizzle as any)
    .select({ value: sql`1` })
    .from(firstJoin.table)
    .$dynamic()

  for (const join of remainingJoins) {
    matchingRows = matchingRows.innerJoin(join.table, join.condition)
  }

  matchingRows = matchingRows.where(and(firstJoin.condition, ...pathConstraints, dateConstraint))

  return isNegated ? notExists(matchingRows) : exists(matchingRows)
}

const getDateOnlyJSONComparisonFromPlan = ({
  operator,
  plan,
}: {
  operator: ResolvedDateFilterPlan['operator']
  plan: ResolvedDateFilterPlan
}): { operator: string; value: string | string[] } | undefined => {
  if (plan.input.kind !== 'calendarDay') {
    return undefined
  }

  const comparison = getDateOnlyComparison({
    date: plan.input.serialized,
    operator,
    timezone: plan.timezone,
  })

  if (!comparison) {
    return undefined
  }

  if (operator === 'equals' || operator === 'not_equals') {
    return {
      operator: operator === 'equals' ? 'date_equals' : 'date_not_equals',
      value: comparison.constraints.map(({ value }) => value.toISOString()),
    }
  }

  const [constraint] = comparison.constraints

  return constraint
    ? { operator: `date_${constraint.operator}`, value: constraint.value.toISOString() }
    : undefined
}

const hasRepeatedAncestorOutsideJSONColumn = ({
  resolvedPathSegments,
  target,
}: {
  resolvedPathSegments: string[]
  target: ResolvedDateFilterTarget
}): boolean =>
  target.lineage
    .slice(0, target.lineage.length - resolvedPathSegments.length)
    .some(({ isRepeated }) => isRepeated)
