/* eslint-disable @typescript-eslint/no-explicit-any, payload/no-relative-monorepo-imports -- Opt-in benchmark bulk-loading uses real adapter transforms while bypassing per-document mutation overhead. */
import type { Field, Payload } from 'payload'

import { flattenAllFields } from 'payload'

import { transform as transformMongoWrite } from '../../../packages/db-mongodb/src/utilities/transform.js'
import { transformForWrite } from '../../../packages/drizzle/src/transform/write/index.js'

export type BulkEntity = { fields: Field[]; slug: string; versions?: boolean }

/** Bounded native loading only; measured writes still use the actual head/projection maintenance. */
export const createNativeBulkLoader = ({ payload }: { payload: Payload }) => {
  const adapter = payload.db as any
  const counters = new Map<string, number>()
  const pending = new Map<string, Record<string, unknown>[]>()
  const insertedTables = new Set<string>()
  let insertedRows = 0
  let nativeCalls = 0

  const allocateID = ({ tableName }: { tableName: string }): number => {
    const next = (counters.get(tableName) ?? 0) + 1

    counters.set(tableName, next)
    return next
  }
  const queue = ({ row, tableName }: { row: Record<string, unknown>; tableName: string }) => {
    if (!pending.has(tableName)) {
      pending.set(tableName, [])
    }
    pending.get(tableName)!.push(row)
  }
  const nested = ({
    arrays,
    parentID,
  }: {
    arrays: Record<string, any[]>
    parentID: unknown
  }): void => {
    for (const [tableName, rows] of Object.entries(arrays)) {
      for (const item of rows) {
        item.row.id ??= allocateID({ tableName })
        item.row._parentID = parentID
        queue({ row: item.row, tableName })
        for (const [locale, localized] of Object.entries(item.locales)) {
          queue({
            row: { ...(localized as object), _parentID: item.row.id, _locale: locale },
            tableName: `${tableName}${adapter.localesSuffix}`,
          })
        }
        nested({ arrays: item.arrays, parentID: item.row.id })
      }
    }
  }

  return {
    get metrics() {
      return { insertedRows, nativeCalls }
    },
    async flush() {
      for (const [tableName, rows] of pending) {
        const columns = Math.max(1, ...rows.map((row) => Object.keys(row).length))
        const chunkSize = Math.min(1000, Math.max(1, Math.floor(30_000 / columns)))

        for (let offset = 0; offset < rows.length; offset += chunkSize) {
          const chunk = rows.slice(offset, offset + chunkSize)

          if (adapter.name === 'mongoose') {
            const model = tableName.startsWith('version:')
              ? adapter.versions[tableName.slice(8)]
              : adapter.collections[tableName]

            await model.collection.insertMany(chunk, { ordered: true })
          } else {
            await adapter.insert({ db: adapter.drizzle, tableName, values: chunk })
          }
          insertedTables.add(tableName)
          nativeCalls++
          insertedRows += chunk.length
        }
      }
      pending.clear()
    },
    async finish() {
      if (!adapter.pool) {
        if (adapter.name !== 'mongoose') {
          await adapter.client.execute('ANALYZE')
        }
        return
      }
      for (const tableName of insertedTables) {
        if (!adapter.tables[tableName].id) {
          continue
        }
        const result = await adapter.pool.query(
          "SELECT pg_get_serial_sequence($1, 'id') AS sequence",
          [tableName],
        )
        const sequence = result.rows[0]?.sequence

        if (sequence) {
          const quotedTable = `"${tableName.replaceAll('"', '""')}"`

          await adapter.pool.query(
            `SELECT setval($1::regclass, (SELECT COALESCE(MAX("id"), 0) + 1 FROM ${quotedTable}), false)`,
            [sequence],
          )
        }
      }
      await adapter.pool.query('ANALYZE')
    },
    /** Roots/locales/blocks are loaded first; self-relationship edges wait until every target exists. */
    add({
      data,
      entity,
      phase = 'content',
    }: {
      data: Record<string, unknown>
      entity: BulkEntity
      phase?: 'content' | 'relationships'
    }) {
      if (adapter.name === 'mongoose') {
        if (phase === 'relationships') {
          return
        }
        const document = structuredClone(data)

        transformMongoWrite({ adapter, data: document, fields: entity.fields, operation: 'write' })
        const model = entity.versions
          ? adapter.versions[entity.slug]
          : adapter.collections[entity.slug]
        const hasCustomID = entity.fields.some((field) => 'name' in field && field.name === 'id')

        document._id =
          entity.versions || !hasCustomID
            ? new model.db.base.Types.ObjectId(String(document.id))
            : document.id
        delete document.id
        queue({
          row: document,
          tableName: entity.versions ? `version:${entity.slug}` : entity.slug,
        })
        return
      }
      const sourceName = entity.slug.replaceAll('-', '_')
      const tableName = adapter.tableNameMap.get(
        entity.versions ? `_${sourceName}${adapter.versionsSuffix}` : sourceName,
      )
      const transformed = transformForWrite({
        adapter,
        data: structuredClone(data),
        fields: flattenAllFields({ fields: entity.fields, cache: true }),
        tableName,
      })
      const id = data.id

      if (phase === 'relationships') {
        for (const relation of transformed.relationships) {
          queue({
            row: { ...relation, parent: id },
            tableName: `${tableName}${adapter.relationshipsSuffix}`,
          })
        }
        return
      }
      transformed.row.id = id
      queue({ row: transformed.row, tableName })
      for (const [locale, localized] of Object.entries(transformed.locales)) {
        queue({
          row: { ...localized, _parentID: id, _locale: locale },
          tableName: `${tableName}${adapter.localesSuffix}`,
        })
      }
      nested({ arrays: transformed.blocks, parentID: id })
      nested({ arrays: transformed.arrays, parentID: id })
      for (const [childTable, rows] of Object.entries(transformed.selects)) {
        for (const row of rows) {
          queue({ row: { ...row, parent: row.parent ?? id }, tableName: childTable })
        }
      }
      for (const [suffix, rows] of [
        [adapter.textsSuffix, transformed.texts],
        [adapter.numbersSuffix, transformed.numbers],
      ] as const) {
        for (const row of rows) {
          queue({ row: { ...row, parent: id }, tableName: `${tableName}${suffix}` })
        }
      }
    },
  }
}
