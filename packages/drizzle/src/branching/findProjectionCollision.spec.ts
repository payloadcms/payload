import type { FlattenedField } from 'payload'

import { createClient } from '@libsql/client'
import { relations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { operatorMap } from '../queries/operatorMap.js'
import { findProjection } from './findProjection.js'

describe('effective query statement names', () => {
  it.each([
    ...[
      'projection_total',
      'PROJECTION_TOTAL',
      'projection_all_ids',
      'projection_selected_ids',
    ].flatMap((tableName) =>
      [false, true].map((hasLocalizedSort) => ({
        hasLocalizedSort,
        localePhysicalName: `${tableName}_locales`,
        tableName,
      })),
    ),
    ...['projection_all_ids', 'projection_selected_ids'].map((tableName) => ({
      hasLocalizedSort: true,
      localePhysicalName: `${tableName}_1`,
      tableName,
    })),
  ])(
    'should read ordinary table $tableName with localized sort $hasLocalizedSort and physical locale table $localePhysicalName',
    async ({ hasLocalizedSort, localePhysicalName, tableName }) => {
      const client = createClient({ url: 'file::memory:' })
      const table = sqliteTable(tableName, { id: integer('id').primaryKey(), title: text('title') })
      const localeTableName = `${tableName}_locales`
      const locales = sqliteTable(localePhysicalName, {
        id: integer('id').primaryKey(),
        _parentID: integer('_parent_id'),
        _locale: text('_locale'),
        title: text('title'),
      })
      const fields: FlattenedField[] = [
        { name: 'id', type: 'number' },
        { name: 'title', type: 'text', localized: hasLocalizedSort },
      ]
      const tables = { [tableName]: table, [localeTableName]: locales }
      const db = drizzle(client, { schema: tables })
      const adapter = {
        drizzle: db,
        idType: 'serial',
        localesSuffix: '_locales',
        name: 'sqlite',
        operatorHandlers: [],
        operators: operatorMap,
        payload: {
          config: {
            localization: { locales: ['en'], localeCodes: ['en'], defaultLocale: 'en' },
          },
          collections: {
            ordinary: {
              customIDType: 'number',
              config: { slug: 'ordinary', fields, flattenedFields: fields },
            },
          },
        },
        tableNameMap: new Map([['ordinary', tableName]]),
        tables,
      } as unknown as DrizzleAdapter

      try {
        await client.execute(`create table "${tableName}" (id integer primary key, title text)`)
        await client.execute(
          `create table "${localePhysicalName}" (id integer primary key, _parent_id integer, _locale text, title text)`,
        )
        await db.insert(table).values([
          { id: 1, title: 'Visible' },
          { id: 2, title: 'Visible' },
          { id: 3, title: 'Hidden' },
        ])
        await db.insert(locales).values([
          { id: 1, _parentID: 1, _locale: 'en', title: 'Visible' },
          { id: 2, _parentID: 2, _locale: 'en', title: 'Visible' },
          { id: 3, _parentID: 3, _locale: 'en', title: 'Hidden' },
        ])

        for (const [page, expected] of [
          [1, [2]],
          [2, [1]],
          [3, []],
        ] as const) {
          const result = await findProjection.call(adapter, {
            collection: 'ordinary',
            joins: false,
            limit: 1,
            locale: 'en',
            page,
            select: { id: true },
            sort: 'title',
            where: { title: { equals: 'Visible' } },
          })

          expect(result.docs.map(({ id }) => id)).toEqual(expected)
          expect(result.totalDocs).toBe(2)
        }
      } finally {
        client.close()
      }
    },
  )

  it('should hydrate a related physical table that shares the direct count CTE name', async () => {
    const client = createClient({ url: 'file::memory:' })
    const table = sqliteTable('ordinary', { id: integer('id').primaryKey() })
    const locales = sqliteTable('projection_total', {
      id: integer('id').primaryKey(),
      _parentID: integer('_parent_id'),
      _locale: text('_locale'),
      title: text('title'),
    })
    const rootRelations = relations(table, ({ many }) => ({
      _locales: many(locales, { relationName: 'localized' }),
    }))
    const localeRelations = relations(locales, ({ one }) => ({
      parent: one(table, {
        fields: [locales._parentID],
        references: [table.id],
        relationName: 'localized',
      }),
    }))
    const tables = { ordinary: table, ordinary_locales: locales }
    const db = drizzle(client, { schema: { ...tables, rootRelations, localeRelations } })
    const fields: FlattenedField[] = [
      { name: 'id', type: 'number' },
      { name: 'title', type: 'text', localized: true },
    ]
    const adapter = {
      drizzle: db,
      idType: 'serial',
      localesSuffix: '_locales',
      name: 'sqlite',
      operatorHandlers: [],
      operators: operatorMap,
      payload: {
        config: {
          localization: { locales: ['en'], localeCodes: ['en'], defaultLocale: 'en' },
        },
        collections: {
          ordinary: {
            customIDType: 'number',
            config: { slug: 'ordinary', fields, flattenedFields: fields },
          },
        },
      },
      tableNameMap: new Map([['ordinary', 'ordinary']]),
      tables,
    } as unknown as DrizzleAdapter

    try {
      await client.execute('create table ordinary (id integer primary key)')
      await client.execute(
        'create table projection_total (id integer primary key, _parent_id integer, _locale text, title text)',
      )
      await db.insert(table).values([{ id: 1 }, { id: 2 }])
      await db.insert(locales).values([
        { id: 1, _parentID: 1, _locale: 'en', title: 'First' },
        { id: 2, _parentID: 2, _locale: 'en', title: 'Second' },
      ])

      const result = await findProjection.call(adapter, {
        collection: 'ordinary',
        joins: false,
        limit: 1,
        locale: 'en',
        sort: 'id',
        where: { id: { greater_than: 0 } },
      })

      expect(result.docs).toEqual([{ id: 1, title: { en: 'First' } }])
      expect(result.totalDocs).toBe(2)
    } finally {
      client.close()
    }
  })
})
