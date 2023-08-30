/* eslint-disable no-param-reassign */
import { and, eq, inArray } from 'drizzle-orm'

import type { BlockRowToInsert } from '../transform/write/types.js'
import type { Args } from './types.js'

import { insertArrays } from '../insertArrays.js'
import { transform } from '../transform/read/index.js'
import { transformForWrite } from '../transform/write/index.js'

export const upsertRow = async ({
  adapter,
  data,
  fallbackLocale,
  fields,
  id,
  locale,
  operation,
  path = '',
  tableName,
  upsertTarget,
  where,
}: Args): Promise<Record<string, unknown>> => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert = transformForWrite({
    data,
    fields,
    locale,
    path,
    tableName,
  })

  // First, we insert the main row
  let insertedRow: Record<string, unknown>

  if (operation === 'update') {
    const target = upsertTarget || adapter.tables[tableName].id

    if (id) {
      rowToInsert.row.id = id
      ;[insertedRow] = await adapter.db
        .insert(adapter.tables[tableName])
        .values(rowToInsert.row)
        .onConflictDoUpdate({ set: rowToInsert.row, target })
        .returning()
    } else {
      ;[insertedRow] = await adapter.db
        .insert(adapter.tables[tableName])
        .values(rowToInsert.row)
        .onConflictDoUpdate({ set: rowToInsert.row, target, where })
        .returning()
    }
  } else {
    ;[insertedRow] = await adapter.db
      .insert(adapter.tables[tableName])
      .values(rowToInsert.row)
      .returning()
  }

  let localeToInsert: Record<string, unknown>
  const relationsToInsert: Record<string, unknown>[] = []
  const blocksToInsert: { [blockType: string]: BlockRowToInsert[] } = {}

  // Maintain a list of promises to run locale, blocks, and relationships
  // all in parallel
  const promises = []

  // If there is a locale row with data, add the parent and locale
  if (Object.keys(rowToInsert.locale).length > 0) {
    rowToInsert.locale._parentID = insertedRow.id
    rowToInsert.locale._locale = locale
    localeToInsert = rowToInsert.locale
  }

  // If there are relationships, add parent to each
  if (rowToInsert.relationships.length > 0) {
    rowToInsert.relationships.forEach((relation) => {
      relation.parent = insertedRow.id
      relationsToInsert.push(relation)
    })
  }

  // If there are blocks, add parent to each, and then
  // store by table name and rows
  Object.keys(rowToInsert.blocks).forEach((blockName) => {
    rowToInsert.blocks[blockName].forEach((blockRow) => {
      blockRow.row._parentID = insertedRow.id
      if (!blocksToInsert[blockName]) blocksToInsert[blockName] = []
      blocksToInsert[blockName].push(blockRow)
    })
  })

  // //////////////////////////////////
  // INSERT LOCALES
  // //////////////////////////////////

  let insertedLocaleRow: Record<string, unknown>

  if (localeToInsert) {
    const localeTableName = adapter.tables[`${tableName}_locales`]

    promises.push(async () => {
      if (operation === 'update') {
        ;[insertedLocaleRow] = await adapter.db
          .insert(localeTableName)
          .values(localeToInsert)
          .onConflictDoUpdate({
            set: localeToInsert,
            target: [localeTableName._locale, localeTableName._parentID],
          })
          .returning()
      } else {
        ;[insertedLocaleRow] = await adapter.db
          .insert(localeTableName)
          .values(localeToInsert)
          .returning()
      }
    })
  }

  // //////////////////////////////////
  // INSERT RELATIONSHIPS
  // //////////////////////////////////

  let insertedRelationshipRows: Record<string, unknown>[]

  if (relationsToInsert.length > 0) {
    promises.push(async () => {
      if (operation === 'update') {
        // Delete any relationship rows for parent ID and paths that have been updated
        // prior to recreating them
        const localizedPathsToDelete = new Set<string>()
        const pathsToDelete = new Set<string>()

        relationsToInsert.forEach((relation) => {
          if (typeof relation.path === 'string') {
            if (typeof relation.locale === 'string') {
              localizedPathsToDelete.add(relation.path)
            } else {
              pathsToDelete.add(relation.path)
            }
          }
        })

        if (localizedPathsToDelete.size > 0) {
          await adapter.db
            .delete(adapter.tables[`${tableName}_relationships`])
            .where(
              and(
                eq(adapter.tables[`${tableName}_relationships`].parent, insertedRow.id),
                inArray(adapter.tables[`${tableName}_relationships`].path, [
                  localizedPathsToDelete,
                ]),
                eq(adapter.tables[`${tableName}_relationships`].locale, locale),
              ),
            )
        }

        if (pathsToDelete.size > 0) {
          await adapter.db
            .delete(adapter.tables[`${tableName}_relationships`])
            .where(
              and(
                eq(adapter.tables[`${tableName}_relationships`].parent, insertedRow.id),
                inArray(
                  adapter.tables[`${tableName}_relationships`].path,
                  Array.from(pathsToDelete),
                ),
              ),
            )
        }
      }

      insertedRelationshipRows = await adapter.db
        .insert(adapter.tables[`${tableName}_relationships`])
        .values(relationsToInsert)
        .returning()
    })
  }

  // //////////////////////////////////
  // INSERT BLOCKS
  // //////////////////////////////////

  const insertedBlockRows: Record<string, Record<string, unknown>[]> = {}

  Object.entries(blocksToInsert).forEach(([blockName, blockRows]) => {
    // For each block, push insert into promises to run parallel
    promises.push(async () => {
      insertedBlockRows[blockName] = await adapter.db
        .insert(adapter.tables[`${tableName}_${blockName}`])
        .values(blockRows.map(({ row }) => row))
        .returning()

      insertedBlockRows[blockName].forEach((row, i) => {
        delete row._parentID
        blockRows[i].row = row
      })

      const blockLocaleIndexMap: number[] = []

      const blockLocaleRowsToInsert = blockRows.reduce((acc, blockRow, i) => {
        if (Object.keys(blockRow.locale).length > 0) {
          blockRow.locale._parentID = blockRow.row.id
          blockRow.locale._locale = locale
          acc.push(blockRow.locale)
          blockLocaleIndexMap.push(i)
          return acc
        }

        return acc
      }, [])

      if (blockLocaleRowsToInsert.length > 0) {
        const insertedBlockLocaleRows = await adapter.db
          .insert(adapter.tables[`${tableName}_${blockName}_locales`])
          .values(blockLocaleRowsToInsert)
          .returning()

        insertedBlockLocaleRows.forEach((blockLocaleRow, i) => {
          delete blockLocaleRow._parentID
          insertedBlockRows[blockName][blockLocaleIndexMap[i]]._locales = [blockLocaleRow]
        })
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        parentRows: insertedBlockRows[blockName],
      })
    })
  })

  // //////////////////////////////////
  // INSERT ARRAYS RECURSIVELY
  // //////////////////////////////////

  promises.push(async () => {
    await insertArrays({
      adapter,
      arrays: [rowToInsert.arrays],
      parentRows: [insertedRow],
    })
  })

  await Promise.all(promises.map((promise) => promise()))

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  if (insertedLocaleRow) insertedRow._locales = [insertedLocaleRow]
  if (insertedRelationshipRows?.length > 0) insertedRow._relationships = insertedRelationshipRows

  Object.entries(insertedBlockRows).forEach(([blockName, blocks]) => {
    if (blocks.length > 0) insertedRow[`_blocks_${blockName}`] = blocks
  })

  const result = transform({
    config: adapter.payload.config,
    data: insertedRow,
    fallbackLocale,
    fields,
    locale,
  })

  return result
}
