import type { Field } from 'payload'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { flattenAllFields } from 'payload'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { operatorMap } from '../queries/operatorMap.js'
import { findProjection } from './findProjection.js'

describe('effective query joined filters with root ordering', () => {
  it.each(['ordinary', 'projection_all_ids', 'PROJECTION_ALL_IDS'])(
    'should deduplicate matching children and retain native root pages for %s',
    async (tableName) => {
      const client = createClient({ url: 'file::memory:' })
      const table = sqliteTable(tableName, {
        id: integer('id').primaryKey(),
        rank: integer('rank'),
      })
      const itemsName = `${tableName}_items`
      const items = sqliteTable(itemsName, {
        id: text('id').primaryKey(),
        _parentID: integer('_parent_id'),
        label: text('label'),
      })
      const fields: Field[] = [
        { name: 'id', type: 'number' },
        { name: 'rank', type: 'number' },
        { name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      ]
      const flattenedFields = flattenAllFields({ fields })
      const tables = { [tableName]: table, [itemsName]: items }
      const statements: string[] = []
      const db = drizzle(client, {
        logger: { logQuery: (query) => statements.push(query) },
        schema: tables,
      })
      const adapter = {
        drizzle: db,
        idType: 'serial',
        localesSuffix: '_locales',
        name: 'sqlite',
        operatorHandlers: [],
        operators: operatorMap,
        payload: {
          config: {},
          collections: {
            ordinary: {
              customIDType: 'number',
              config: { slug: 'ordinary', fields, flattenedFields },
            },
          },
        },
        tableNameMap: new Map([
          ['ordinary', tableName],
          [`${tableName}_items`, itemsName],
        ]),
        tables,
      } as unknown as DrizzleAdapter

      try {
        await client.execute(`create table "${tableName}" (id integer primary key, rank integer)`)
        await client.execute(
          `create table "${itemsName}" (id text primary key, _parent_id integer, label text)`,
        )
        await db.insert(table).values([
          { id: 1, rank: null },
          { id: 2, rank: 5 },
          { id: 10, rank: 5 },
          { id: 20, rank: 1 },
          { id: 30, rank: 9 },
        ])
        await db.insert(items).values([
          { id: 'a', _parentID: 1, label: 'visible' },
          { id: 'b', _parentID: 1, label: 'visible' },
          { id: 'c', _parentID: 2, label: 'visible' },
          { id: 'd', _parentID: 2, label: 'visible' },
          { id: 'e', _parentID: 10, label: 'visible' },
          { id: 'f', _parentID: 30, label: 'hidden' },
        ])
        statements.length = 0

        for (const [sort, ids] of [
          [
            ['rank', 'id'],
            [1, 20, 2, 10],
          ],
          [
            ['-rank', '-id'],
            [10, 2, 20, 1],
          ],
        ] as const) {
          for (const [index, id] of [...ids, undefined].entries()) {
            const result = await findProjection.call(adapter, {
              collection: 'ordinary',
              joins: false,
              limit: 1,
              page: index + 1,
              select: { id: true },
              sort: [...sort],
              where: {
                or: [{ 'items.label': { equals: 'visible' } }, { rank: { equals: 1 } }],
              },
            })

            expect(result.docs.map(({ id }) => id)).toEqual(id === undefined ? [] : [id])
            expect(result.totalDocs).toBe(4)
          }
        }

        const unlimited = await findProjection.call(adapter, {
          collection: 'ordinary',
          joins: false,
          limit: 0,
          select: { id: true },
          sort: 'id',
          where: { 'items.label': { equals: 'visible' } },
        })

        expect(unlimited.docs.map(({ id }) => id)).toEqual([1, 2, 10])
        expect(unlimited.totalDocs).toBe(3)
        expect(statements.every((statement) => !statement.includes('row_number()'))).toBe(true)
        expect(statements[0]).toContain('count(distinct')
        expect(statements[0]).not.toContain('select distinct')
        expect(statements[0]).not.toContain('group by')
        expect(statements[0]).toContain('as materialized')
      } finally {
        client.close()
      }
    },
  )
})
