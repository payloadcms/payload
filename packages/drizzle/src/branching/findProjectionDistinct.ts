import type { FindDistinct } from 'payload'

import { count, max, sql } from 'drizzle-orm'
import { getFieldByPath } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

import { buildQuery } from '../queries/buildQuery.js'
import { getTransaction } from '../utilities/getTransaction.js'
import { DistinctSymbol } from '../utilities/rawConstraint.js'

/** Distinct values and their count are evaluated in one native statement snapshot. */
export const findProjectionDistinct: FindDistinct = async function (this: DrizzleAdapter, args) {
  const config = this.payload.collections[args.collection].config
  const tableName = this.tableNameMap.get(toSnakeCase(config.slug))
  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter: this,
    fields: config.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? args.field,
    tableName,
    where: { and: [args.where ?? {}, { [args.field]: { equals: DistinctSymbol } }] },
  })
  const selected = selectFields._selected
  const page = args.page ?? 1
  const limit = args.limit ?? 0
  const offset = limit ? (page - 1) * limit : 0
  const db = await getTransaction(this, args.req)

  orderBy.pop()

  const selectedExpression = sql`${selected}`

  if (selected && typeof selected.mapFromDriverValue === 'function') {
    selectedExpression.mapWith(selected)
  }

  const fields = {
    selected: selectedExpression.as('projection_selected'),
    total: sql`count(*) over ()`.as('projection_total'),
  }

  orderBy.forEach(({ column, projectionAggregate }, index) => {
    fields[`order${index}`] =
      sql`${column === selected ? column : (projectionAggregate ?? max(column))}`.as(
        `projection_order_${index}`,
      )
  })

  let grouped = (db as any)
    .select(fields)
    .from(this.tables[tableName])
    .where(where)
    // Reuse the selected expression: repeating correlated lookups creates different
    // parameter identities that PostgreSQL cannot recognize as the same grouping key.
    .groupBy(sql`1`)
    .$dynamic()

  for (const join of joins) {
    grouped = grouped[join.type ?? 'leftJoin'](join.table, join.condition)
  }

  const all = grouped.as('projection_distinct_values')
  let native = (db as any).select({ selected: all.selected, total: all.total }).from(all).$dynamic()

  native = native.orderBy(...orderBy.map(({ order }, index) => order(all[`order${index}`])))

  if (limit) {
    native = native.limit(limit).offset(offset)
  }

  const rows = await native
  let totalDocs = Number(rows[0]?.total ?? 0)

  if (!rows.length) {
    const counts = await (db as any).select({ total: count() }).from(all)

    totalDocs = Number(counts[0]?.total ?? 0)

    if (totalDocs > offset) {
      const error = new Error('The selected branch content changed during the read operation.')

      Object.assign(error, { code: 'branch-projection-conflict' })
      throw error
    }
  }

  const field = getFieldByPath({
    config: this.payload.config,
    fields: config.flattenedFields,
    includeRelationships: true,
    path: args.field,
  })?.field
  const polymorphicValueField = args.field.endsWith('.value')
    ? getFieldByPath({
        config: this.payload.config,
        fields: config.flattenedFields,
        includeRelationships: true,
        path: args.field.slice(0, -'.value'.length),
      })?.field
    : undefined
  const isPolymorphicValue =
    polymorphicValueField &&
    'relationTo' in polymorphicValueField &&
    Array.isArray(polymorphicValueField.relationTo)
  const values = rows.map(({ selected: value }) => {
    if (isPolymorphicValue) {
      return { [args.field]: typeof value === 'string' ? JSON.parse(value) : value }
    }

    if (field && 'relationTo' in field && Array.isArray(field.relationTo) && value != null) {
      const json = typeof value === 'string' ? JSON.parse(value) : value
      const relationTo = Object.keys(json).find(
        (key) => json[key] !== null && json[key] !== undefined,
      )

      value = relationTo ? { relationTo, value: json[relationTo] } : null
    }

    return { [args.field]: value }
  })
  const totalPages = limit ? Math.ceil(totalDocs / limit) : 1
  const hasNextPage = Boolean(limit) && totalPages > page
  const hasPrevPage = Boolean(limit) && page > 1

  return {
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter: limit ? offset + 1 : 1,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
    values,
  }
}
