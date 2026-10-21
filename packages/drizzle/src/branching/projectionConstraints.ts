import type { Column, SQL, Table } from 'drizzle-orm'

import { and, eq, exists, getTableName, or, sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases } from '../queries/buildQuery.js'
import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { ProjectionQueryAdapter } from './createProjectionQueries.js'

import { getTableAlias } from '../queries/getTableAlias.js'
import { parseParams } from '../queries/parseParams.js'
import { projectionCompilingAccess, projectionQueryContext } from './createProjectionQueries.js'
import { branchProjectionLocaleKey } from './projectionLocaleNamespace.js'

/** Resolves ordinary logical foreign keys without changing their stored representation. */
export const getProjectionTarget = ({
  adapter,
  collection,
}: {
  adapter: DrizzleAdapter
  collection: string
}) => {
  const original = adapter.payload.collections[collection]?.config
  const projection = (adapter as ProjectionQueryAdapter)[projectionQueryContext]
    ? original?.custom?.branchQueryStorage?.projection
    : undefined
  const targetCollection = typeof projection === 'string' ? projection : collection
  const config = adapter.payload.collections[targetCollection]?.config

  return {
    collection: targetCollection,
    config,
    idField: targetCollection === collection ? 'id' : '_branchProjection_logicalID',
    tableName: adapter.tableNameMap.get(toSnakeCase(targetCollection)),
  }
}

/** Matches a physical table through Drizzle aliases without depending on generated alias names. */
export const getProjectionCollection = ({
  adapter,
  table,
}: {
  adapter: DrizzleAdapter
  table: Table
}): string | undefined => {
  if (!(adapter as ProjectionQueryAdapter)[projectionQueryContext]) {
    return undefined
  }

  const originalName =
    (table as unknown as Record<symbol, string>)[Symbol.for('drizzle:OriginalName')] ??
    getTableName(table)

  return Object.values(adapter.payload.collections).find(
    ({ config }) => adapter.tableNameMap.get(toSnakeCase(config.slug)) === originalName,
  )?.config.slug
}

/** Root visibility is a driving-table predicate so branch-leading indexes remain usable. */
export const projectionRootConstraint = ({
  adapter,
  collection,
  joins,
  locale,
  table,
}: {
  adapter: DrizzleAdapter
  collection: string
  joins: BuildQueryJoinAliases
  locale?: string
  table: GenericTable
}): SQL | undefined => {
  const context = (adapter as ProjectionQueryAdapter)[projectionQueryContext]
  const config = adapter.payload.collections[collection]?.config
  if (!context || !config) {
    return undefined
  }
  const access = (adapter as ProjectionQueryAdapter)[projectionCompilingAccess]
    ? {}
    : context.relationAccess[collection]
  if (!access) {
    return sql`false`
  }
  const nestedAdapter = Object.assign(Object.create(adapter), {
    [projectionCompilingAccess]: true,
  }) as DrizzleAdapter
  const policyJoins: BuildQueryJoinAliases = []
  const predicate = parseParams({
    adapter: nestedAdapter,
    aliasTable: table,
    context: { sort: undefined },
    fields: config.flattenedFields,
    joins: policyJoins,
    locale,
    parentIsLocalized: false,
    selectFields: {},
    tableName: adapter.tableNameMap.get(toSnakeCase(collection)),
    where: access,
  })
  guardProjectionJoins({ adapter: nestedAdapter, joins: policyJoins, locale })
  joins.push(...policyJoins)
  return and(
    predicate,
    ...(config.custom?.branchProjectionStorage
      ? [
          eq(table['_branchProjection_branchKey'], context.branchKey),
          eq(table['_branchProjection_isVisible'], true),
        ]
      : []),
  )
}

/** A correlated native relation, including the original collection's read predicate. */
export const projectionRelationConstraint = ({
  adapter,
  collection,
  idColumn,
  locale,
}: {
  adapter: DrizzleAdapter
  collection: string
  idColumn: Column | SQL
  locale?: string
}): SQL | undefined => {
  const scoped = adapter as ProjectionQueryAdapter
  const context = scoped[projectionQueryContext]
  const target = getProjectionTarget({ adapter, collection })
  const { config } = target

  if (!context || !config) {
    return undefined
  }

  const isCompilingAccess = scoped[projectionCompilingAccess] === true
  const access = isCompilingAccess ? {} : context.relationAccess[target.collection]

  if (access === false || access === undefined) {
    return sql`false`
  }

  const tableName = target.tableName
  const { newAliasTable: table } = getTableAlias({ adapter, tableName })
  // User relationship hops enforce the target policy once. Trusted policy expressions
  // traverse the same visible branch relation without recursively expanding policies.
  const nestedAdapter = Object.assign(Object.create(adapter), {
    [projectionCompilingAccess]: true,
    tables: { ...adapter.tables, [tableName]: table },
  }) as DrizzleAdapter
  const joins: BuildQueryJoinAliases = []
  const predicate = parseParams({
    adapter: nestedAdapter,
    aliasTable: table,
    context: { sort: undefined },
    fields: config.flattenedFields,
    joins,
    locale,
    parentIsLocalized: false,
    selectFields: {},
    tableName,
    where: access,
  })

  guardProjectionJoins({ adapter: nestedAdapter, joins, locale })

  let query = (adapter.drizzle as any).select({ id: table.id }).from(table).$dynamic()

  for (const join of joins) {
    query = query[join.type ?? 'leftJoin'](join.table, join.condition)
  }

  return exists(
    query.where(
      and(
        eq(table[target.idField], idColumn),
        ...(config.custom?.branchProjectionStorage
          ? [
              eq(table._branchProjection_branchKey, context.branchKey),
              eq(table._branchProjection_isVisible, true),
            ]
          : []),
        predicate,
      ),
    ),
  )
}

/** Resolves an ambiguous polymorphic `.value` comparison to the original typed logical ID. */
export const projectionLogicalIDColumn = ({
  adapter,
  collection,
  idColumn,
  locale,
}: {
  adapter: DrizzleAdapter
  collection: string
  idColumn: Column | SQL
  locale?: string
}): { idType: 'number' | 'text' | 'uuid'; rawColumn: SQL } | undefined => {
  const target = getProjectionTarget({ adapter, collection })
  const { config } = target

  if (
    !(adapter as ProjectionQueryAdapter)[projectionQueryContext] ||
    !config?.custom?.branchProjectionStorage
  ) {
    return undefined
  }

  const metadata = config.flattenedFields.find((field) => field.name === '_branchProjection')
  const logicalID =
    metadata?.type === 'group'
      ? metadata.flattenedFields.find((field) => field.name === 'logicalID')
      : undefined
  const idType = logicalID?.type === 'number' ? 'number' : 'text'
  const tableName = target.tableName
  const { newAliasTable: table } = getTableAlias({ adapter, tableName })
  const query = (adapter.drizzle as any)
    .select({ id: table._branchProjection_logicalID })
    .from(table)
    .where(
      and(
        eq(table[target.idField], idColumn),
        projectionRelationConstraint({
          adapter,
          collection: target.collection,
          idColumn: table.id,
          locale,
        }),
      ),
    )

  return { idType, rawColumn: sql`(${query})` }
}

/** JSON preserves scalar ID types while SQL groups heterogeneous polymorphic values. */
export const projectionTypedValue = ({
  adapter,
  columns,
}: {
  adapter: DrizzleAdapter
  columns: { rawColumn: SQL }[]
}): SQL | undefined => {
  if (!(adapter as ProjectionQueryAdapter)[projectionQueryContext]) {
    return undefined
  }
  const values = columns.map(({ rawColumn }) =>
    adapter.name === 'sqlite'
      ? sql`case when ${rawColumn} is not null then json_quote(${rawColumn}) else null end`
      : sql`to_jsonb(${rawColumn})`,
  )

  return adapter.name === 'sqlite'
    ? sql`coalesce(${sql.join([...values, sql`'null'`], sql`, `)})`
    : sql`cast(coalesce(${sql.join([...values, sql`'null'::jsonb`], sql`, `)}) as text)`
}

/** Collection slugs are JSON values, including valid hyphens; bind them as SQL data. */
export const projectionPolymorphicValue = ({
  adapter,
  values,
}: {
  adapter: DrizzleAdapter
  values: Record<string, SQL>
}): SQL | undefined => {
  if (!(adapter as ProjectionQueryAdapter)[projectionQueryContext]) {
    return undefined
  }
  const entries = Object.entries(values).flatMap(([key, value]) => [
    sql`cast(${key} as text)`,
    value,
  ])

  return adapter.name === 'sqlite'
    ? sql`json_object(${sql.join(entries, sql`, `)})`
    : sql`json_build_object(${sql.join(entries, sql`, `)})`
}

/** Adds relation restrictions inside ON, preserving nullable/negative left-join semantics. */
export const guardProjectionJoins = ({
  adapter,
  joins,
  locale,
}: {
  adapter: DrizzleAdapter
  joins: BuildQueryJoinAliases
  locale?: string
}): BuildQueryJoinAliases => {
  if (!(adapter as ProjectionQueryAdapter)[projectionQueryContext]) {
    return joins
  }

  for (const join of joins) {
    if (adapter.name === 'postgres' && join.table[branchProjectionLocaleKey]) {
      join.condition = and(
        join.condition,
        eq(
          join.table[branchProjectionLocaleKey],
          (adapter as ProjectionQueryAdapter)[projectionQueryContext].branchKey,
        ),
      )
    }

    const collection = getProjectionCollection({ adapter, table: join.table })

    if (collection) {
      join.condition = and(
        join.condition,
        projectionRelationConstraint({ adapter, collection, idColumn: join.table['id'], locale }),
      )
      continue
    }

    // Relationship link rows can be queried directly (ID, relationTo, distinct), without joining the target.
    const originalName =
      (join.table as unknown as Record<symbol, string>)[Symbol.for('drizzle:OriginalName')] ??
      getTableName(join.table)
    const owner = Object.values(adapter.payload.collections).find(
      ({ config }) =>
        `${adapter.tableNameMap.get(toSnakeCase(config.slug))}${adapter.relationshipsSuffix}` ===
        originalName,
    )
    const ownerConstraint = owner
      ? projectionRelationConstraint({
          adapter,
          collection: owner.config.slug,
          idColumn: join.table['parent'],
          locale,
        })
      : undefined
    const predicates = Object.values(adapter.payload.collections).flatMap(({ config }) => {
      const column = (join.table as GenericTable)[`${config.slug}ID`]

      return column
        ? [
            projectionRelationConstraint({
              adapter,
              collection: config.slug,
              idColumn: column,
              locale,
            }),
          ]
        : []
    })

    if (predicates.length) {
      join.condition = and(join.condition, ownerConstraint, or(...predicates))
    }
  }

  return joins
}
