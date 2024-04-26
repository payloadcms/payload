/* eslint-disable no-param-reassign */
import type { TypeWithID } from 'payload/types'

import { eq } from 'drizzle-orm'
import { ValidationError } from 'payload/errors'
import { i18nInit } from 'payload/utilities'

import type { BlockRowToInsert } from '../transform/write/types'
import type { Args } from './types'

import { buildFindManyArgs } from '../find/buildFindManyArgs'
import { transform } from '../transform/read'
import { transformForWrite } from '../transform/write'
import { deleteExistingArrayRows } from './deleteExistingArrayRows'
import { deleteExistingRowsByPath } from './deleteExistingRowsByPath'
import { insertArrays } from './insertArrays'

export const upsertRow = async <T extends TypeWithID>({
  id,
  adapter,
  data,
  db,
  fields,
  operation,
  path = '',
  req,
  tableName,
  upsertTarget,
  where,
}: Args): Promise<T> => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert = transformForWrite({
    adapter,
    data,
    fields,
    path,
    tableName,
  })

  // First, we insert the main row
  let insertedRow: Record<string, unknown>

  try {
    if (operation === 'update') {
      const target = upsertTarget || adapter.tables[tableName].id

      if (id) {
        rowToInsert.row.id = id
        ;[insertedRow] = await db
          .insert(adapter.tables[tableName])
          .values(rowToInsert.row)
          .onConflictDoUpdate({ set: rowToInsert.row, target })
          .returning()
      } else {
        ;[insertedRow] = await db
          .insert(adapter.tables[tableName])
          .values(rowToInsert.row)
          .onConflictDoUpdate({ set: rowToInsert.row, target, where })
          .returning()
      }
    } else {
      ;[insertedRow] = await db
        .insert(adapter.tables[tableName])
        .values(rowToInsert.row)
        .returning()
    }

    const localesToInsert: Record<string, unknown>[] = []
    const relationsToInsert: Record<string, unknown>[] = []
    const textsToInsert: Record<string, unknown>[] = []
    const numbersToInsert: Record<string, unknown>[] = []
    const blocksToInsert: { [blockType: string]: BlockRowToInsert[] } = {}
    const selectsToInsert: { [selectTableName: string]: Record<string, unknown>[] } = {}

    // If there are locale rows with data, add the parent and locale to each
    if (Object.keys(rowToInsert.locales).length > 0) {
      Object.entries(rowToInsert.locales).forEach(([locale, localeRow]) => {
        localeRow._parentID = insertedRow.id
        localeRow._locale = locale
        localesToInsert.push(localeRow)
      })
    }

    // If there are relationships, add parent to each
    if (rowToInsert.relationships.length > 0) {
      rowToInsert.relationships.forEach((relation) => {
        relation.parent = insertedRow.id
        relationsToInsert.push(relation)
      })
    }

    // If there are texts, add parent to each
    if (rowToInsert.texts.length > 0) {
      rowToInsert.texts.forEach((textRow) => {
        textRow.parent = insertedRow.id
        textsToInsert.push(textRow)
      })
    }

    // If there are numbers, add parent to each
    if (rowToInsert.numbers.length > 0) {
      rowToInsert.numbers.forEach((numberRow) => {
        numberRow.parent = insertedRow.id
        numbersToInsert.push(numberRow)
      })
    }

    // If there are selects, add parent to each, and then
    // store by table name and rows
    if (Object.keys(rowToInsert.selects).length > 0) {
      Object.entries(rowToInsert.selects).forEach(([selectTableName, selectRows]) => {
        selectRows.forEach((row) => {
          if (typeof row.parent === 'undefined') {
            row.parent = insertedRow.id
          }
          if (!selectsToInsert[selectTableName]) selectsToInsert[selectTableName] = []
          selectsToInsert[selectTableName].push(row)
        })
      })
    }

    // If there are blocks, add parent to each, and then
    // store by table name and rows
    Object.keys(rowToInsert.blocks).forEach((blockName) => {
      rowToInsert.blocks[blockName].forEach((blockRow) => {
        blockRow.row._parentID = insertedRow.id
        if (!blocksToInsert[blockName]) blocksToInsert[blockName] = []
        if (blockRow.row.uuid) {
          delete blockRow.row.uuid
        }
        blocksToInsert[blockName].push(blockRow)
      })
    })

    // //////////////////////////////////
    // INSERT LOCALES
    // //////////////////////////////////

    if (localesToInsert.length > 0) {
      const localeTable = adapter.tables[`${tableName}${adapter.localesSuffix}`]

      if (operation === 'update') {
        await db.delete(localeTable).where(eq(localeTable._parentID, insertedRow.id))
      }

      await db.insert(localeTable).values(localesToInsert)
    }

    // //////////////////////////////////
    // INSERT RELATIONSHIPS
    // //////////////////////////////////

    const relationshipsTableName = `${tableName}${adapter.relationshipsSuffix}`

    if (operation === 'update') {
      await deleteExistingRowsByPath({
        adapter,
        db,
        localeColumnName: 'locale',
        parentColumnName: 'parent',
        parentID: insertedRow.id,
        pathColumnName: 'path',
        rows: [...relationsToInsert, ...rowToInsert.relationshipsToDelete],
        tableName: relationshipsTableName,
      })
    }

    if (relationsToInsert.length > 0) {
      await db.insert(adapter.tables[relationshipsTableName]).values(relationsToInsert)
    }

    // //////////////////////////////////
    // INSERT hasMany TEXTS
    // //////////////////////////////////

    const textsTableName = `${tableName}_texts`

    if (operation === 'update') {
      await deleteExistingRowsByPath({
        adapter,
        db,
        localeColumnName: 'locale',
        parentColumnName: 'parent',
        parentID: insertedRow.id,
        pathColumnName: 'path',
        rows: textsToInsert,
        tableName: textsTableName,
      })
    }

    if (textsToInsert.length > 0) {
      await db.insert(adapter.tables[textsTableName]).values(textsToInsert).returning()
    }

    // //////////////////////////////////
    // INSERT hasMany NUMBERS
    // //////////////////////////////////

    const numbersTableName = `${tableName}_numbers`

    if (operation === 'update') {
      await deleteExistingRowsByPath({
        adapter,
        db,
        localeColumnName: 'locale',
        parentColumnName: 'parent',
        parentID: insertedRow.id,
        pathColumnName: 'path',
        rows: numbersToInsert,
        tableName: numbersTableName,
      })
    }

    if (numbersToInsert.length > 0) {
      await db.insert(adapter.tables[numbersTableName]).values(numbersToInsert).returning()
    }

    // //////////////////////////////////
    // INSERT BLOCKS
    // //////////////////////////////////

    const insertedBlockRows: Record<string, Record<string, unknown>[]> = {}

    if (operation === 'update') {
      for (const blockName of rowToInsert.blocksToDelete) {
        const blockTableName = adapter.tableNameMap.get(`${tableName}_blocks_${blockName}`)
        const blockTable = adapter.tables[blockTableName]
        await db.delete(blockTable).where(eq(blockTable._parentID, insertedRow.id))
      }
    }

    for (const [blockName, blockRows] of Object.entries(blocksToInsert)) {
      const blockTableName = adapter.tableNameMap.get(`${tableName}_blocks_${blockName}`)
      insertedBlockRows[blockName] = await db
        .insert(adapter.tables[blockTableName])
        .values(blockRows.map(({ row }) => row))
        .returning()

      insertedBlockRows[blockName].forEach((row, i) => {
        blockRows[i].row = row
      })

      const blockLocaleIndexMap: number[] = []

      const blockLocaleRowsToInsert = blockRows.reduce((acc, blockRow, i) => {
        if (Object.entries(blockRow.locales).length > 0) {
          Object.entries(blockRow.locales).forEach(([blockLocale, blockLocaleData]) => {
            if (Object.keys(blockLocaleData).length > 0) {
              blockLocaleData._parentID = blockRow.row.id
              blockLocaleData._locale = blockLocale
              acc.push(blockLocaleData)
              blockLocaleIndexMap.push(i)
            }
          })
        }

        return acc
      }, [])

      if (blockLocaleRowsToInsert.length > 0) {
        await db
          .insert(adapter.tables[`${blockTableName}${adapter.localesSuffix}`])
          .values(blockLocaleRowsToInsert)
          .returning()
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        db,
        parentRows: insertedBlockRows[blockName],
      })
    }

    // //////////////////////////////////
    // INSERT ARRAYS RECURSIVELY
    // //////////////////////////////////

    if (operation === 'update') {
      for (const arrayTableName of Object.keys(rowToInsert.arrays)) {
        await deleteExistingArrayRows({
          adapter,
          db,
          parentID: insertedRow.id,
          tableName: arrayTableName,
        })
      }
    }

    await insertArrays({
      adapter,
      arrays: [rowToInsert.arrays],
      db,
      parentRows: [insertedRow],
    })

    // //////////////////////////////////
    // INSERT hasMany SELECTS
    // //////////////////////////////////

    for (const [selectTableName, tableRows] of Object.entries(selectsToInsert)) {
      const selectTable = adapter.tables[selectTableName]
      if (operation === 'update') {
        await db.delete(selectTable).where(eq(selectTable.parent, insertedRow.id))
      }
      await db.insert(selectTable).values(tableRows).returning()
    }

    // //////////////////////////////////
    // Error Handling
    // //////////////////////////////////
  } catch (error) {
    throw error.code === '23505'
      ? new ValidationError(
          [
            {
              field: adapter.fieldConstraints[tableName][error.constraint],
              message: req.t('error:valueMustBeUnique'),
            },
          ],
          req?.t ?? i18nInit(req.payload.config.i18n).t,
        )
      : error
  }

  // //////////////////////////////////
  // RETRIEVE NEWLY UPDATED ROW
  // //////////////////////////////////

  const findManyArgs = buildFindManyArgs({
    adapter,
    depth: 0,
    fields,
    tableName,
  })

  findManyArgs.where = eq(adapter.tables[tableName].id, insertedRow.id)

  const doc = await db.query[tableName].findFirst(findManyArgs)

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  const result = transform<T>({
    config: adapter.payload.config,
    data: doc,
    fields,
  })

  return result
}
