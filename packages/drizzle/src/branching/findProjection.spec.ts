import type { Field } from 'payload'

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { alias, pgSchema, pgTable, text } from 'drizzle-orm/pg-core'
import { flattenAllFields } from 'payload'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { operatorMap } from '../queries/operatorMap.js'
import { buildQuery } from '../queries/buildQuery.js'
import { projectionQueryContext } from './createProjectionQueries.js'
import { findProjection } from './findProjection.js'
import { projectionRelationConstraint } from './projectionConstraints.js'

describe('effective projection relational aliases', () => {
  it.each(
    [undefined, 'custom', 'custom"schema'].flatMap((schemaName) =>
      ['root', 'localized', 'joined'].map((mode) => ({ mode, schemaName })),
    ),
  )(
    'should compile $mode paging with correct aliases for $schemaName',
    async ({ mode, schemaName }) => {
      const tableName = 'branch_projection'
      const columns = { id: text('source_id').primaryKey(), title: text('title') }
      const table = schemaName
        ? pgSchema(schemaName).table(tableName, columns)
        : pgTable(tableName, columns)
      const localesName = `${tableName}_locales`
      const localeColumns = {
        id: text('id').primaryKey(),
        _locale: text('_locale'),
        _parentID: text('_parent_id'),
        title: text('title'),
      }
      const locales = schemaName
        ? pgSchema(schemaName).table(localesName, localeColumns)
        : pgTable(localesName, localeColumns)
      const itemsName = `${tableName}_items`
      const itemColumns = {
        id: text('id').primaryKey(),
        _parentID: text('_parent_id'),
        label: text('label'),
      }
      const items = schemaName
        ? pgSchema(schemaName).table(itemsName, itemColumns)
        : pgTable(itemsName, itemColumns)
      let statement = ''
      let parameters: unknown[] = []
      const captured = new Error('captured native statement')
      const db = drizzle({
        client: {
          query: ({ text: query }: { text: string }, params: unknown[]) => {
            statement = query
            parameters = params
            throw captured
          },
        } as any,
        schema: { [tableName]: table },
      })
      const fields: Field[] = [
        { name: 'id', type: 'text' },
        { name: 'title', type: 'text', localized: mode === 'localized' },
        { name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      ]
      const flattenedFields = flattenAllFields({ fields })
      const adapter = {
        drizzle: db,
        idType: 'uuid',
        name: 'postgres',
        localesSuffix: '_locales',
        operatorHandlers: [],
        operators: operatorMap,
        payload: {
          config: {
            localization: { locales: ['en', 'fr'], localeCodes: ['en', 'fr'], defaultLocale: 'en' },
          },
          collections: {
            'branch-projection': {
              customIDType: 'text',
              config: { slug: 'branch-projection', fields, flattenedFields },
            },
          },
        },
        tableNameMap: new Map([
          [tableName, tableName],
          [itemsName, itemsName],
        ]),
        tables: { [tableName]: table, [localesName]: locales, [itemsName]: items },
      } as unknown as DrizzleAdapter

      await expect(
        findProjection.call(adapter, {
          collection: 'branch-projection',
          limit: 1,
          locale: 'en',
          select: { id: true },
          sort: 'title',
          joins: false,
          where:
            mode === 'joined'
              ? { 'items.label': { equals: 'visible' } }
              : { title: { equals: 'visible' } },
        }),
      ).rejects.toMatchObject({ cause: captured })

      if (mode !== 'root') {
        expect(statement).toContain('row_number() over')
        expect(statement).toContain('group by')
        expect(statement).not.toContain('count(distinct')
        expect(statement).toContain(
          'where "projection_selected_ids"."source_id" = "branch_projection"."source_id"',
        )
      } else {
        expect(statement).not.toContain('row_number() over')
        expect(statement).not.toContain('projection_all_ids')
        expect(statement).toContain('projection_total')
        expect(statement).toContain('order by "branch_projection"."title" asc')
        expect(statement).toContain('limit $')
        expect(parameters.filter((value) => value === 'visible')).toHaveLength(2)
      }
      expect(statement).toContain(
        schemaName
          ? `from "${schemaName.replaceAll('"', '""')}"."branch_projection"`
          : 'from "branch_projection"',
      )
    },
  )

  it.each(['access', 'sort'] as const)(
    'should join localized %s fields to the aliased root in a custom schema',
    (mode) => {
      const schema = pgSchema('custom')
      const table = schema.table('branch_projection', { id: text('source_id').primaryKey() })
      const locales = schema.table('branch_projection_locales', {
        id: text('id').primaryKey(),
        _locale: text('_locale'),
        _parentID: text('_parent_id'),
        details_heading: text('details_heading'),
      })
      const db = drizzle({ client: {} as any })
      const fields: Field[] = [
        { name: 'id', type: 'text' },
        {
          name: 'details',
          type: 'group',
          localized: true,
          fields: [{ name: 'heading', type: 'text', localized: true }],
        },
      ]
      const adapter = {
        [projectionQueryContext]: {
          branchKey: 'staging',
          relationAccess: {
            'branch-projection':
              mode === 'access' ? { 'details.heading': { equals: 'visible' } } : {},
          },
        },
        drizzle: db,
        idType: 'uuid',
        name: 'postgres',
        localesSuffix: '_locales',
        operatorHandlers: [],
        operators: operatorMap,
        payload: {
          config: {
            localization: { locales: ['en', 'fr'], localeCodes: ['en', 'fr'], defaultLocale: 'en' },
          },
          collections: {
            'branch-projection': {
              customIDType: 'text',
              config: {
                slug: 'branch-projection',
                fields,
                flattenedFields: flattenAllFields({ fields }),
              },
            },
          },
        },
        tableNameMap: new Map([['branch_projection', 'branch_projection']]),
        tables: { branch_projection: table, branch_projection_locales: locales },
      } as unknown as DrizzleAdapter
      let compiled: { params: unknown[]; sql: string }

      if (mode === 'access') {
        const predicate = projectionRelationConstraint({
          adapter,
          collection: 'branch-projection',
          idColumn: sql`'physical-id'`,
          locale: 'en',
        })

        compiled = db
          .select({ visible: predicate })
          .from(sql`(select 1) as policy_probe`)
          .toSQL()
      } else {
        const selectedTarget = alias(table, 'selected_target')
        const { joins, orderBy, where } = buildQuery({
          adapter,
          aliasTable: selectedTarget,
          fields: flattenAllFields({ fields }),
          locale: 'en',
          sort: 'details.heading',
          tableName: 'branch_projection',
          where: {},
        })
        let query = db
          .select({ id: selectedTarget.id })
          .from(selectedTarget)
          .where(where)
          .$dynamic()

        for (const join of joins) {
          query = query[join.type ?? 'leftJoin'](join.table, join.condition)
        }

        compiled = query.orderBy(...orderBy.map(({ column, order }) => order(column))).toSQL()
      }
      const relationAlias = /from "custom"\."branch_projection" "([^"]+)"/.exec(compiled.sql)?.[1]

      expect(relationAlias).toBeTruthy()
      expect(compiled.sql).toContain(
        `"${relationAlias}"."source_id" = "custom"."branch_projection_locales"."_parent_id"`,
      )
      expect(compiled.sql).not.toContain('"custom"."branch_projection"."source_id"')
      if (mode === 'access') {
        expect(compiled.params).toContain('visible')
      }
      expect(adapter.tables.branch_projection).toBe(table)
    },
  )
})
