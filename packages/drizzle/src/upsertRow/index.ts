import type { TypeWithID } from 'payload'

import { eq } from 'drizzle-orm'
import { ValidationError } from 'payload'

import type { BlockRowToInsert } from '../transform/write/types.js'
import type { Args } from './types.js'

import { buildFindManyArgs } from '../find/buildFindManyArgs.js'
import { transform } from '../transform/read/index.js'
import { transformForWrite } from '../transform/write/index.js'
import { deleteExistingArrayRows } from './deleteExistingArrayRows.js'
import { deleteExistingRowsByPath } from './deleteExistingRowsByPath.js'
import { insertArrays } from './insertArrays.js'

export const upsertRow = async <T extends Record<string, unknown> | TypeWithID>({
  id,
  adapter,
  data,
  db,
  fields,
  ignoreResult,
  // TODO:
  // When we support joins for write operations (create/update) - pass collectionSlug to the buildFindManyArgs
  // Make a new argument in upsertRow.ts and pass the slug from every operation.
  joinQuery: _joinQuery,
  operation,
  path = '',
  req,
  select,
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
        ;[insertedRow] = await adapter.insert({
          db,
          onConflictDoUpdate: { set: rowToInsert.row, target },
          tableName,
          values: rowToInsert.row,
        })
      } else {
        ;[insertedRow] = await adapter.insert({
          db,
          onConflictDoUpdate: { set: rowToInsert.row, target, where },
          tableName,
          values: rowToInsert.row,
        })
      }
    } else {
      if (adapter.allowIDOnCreate && data.id) {
        rowToInsert.row.id = data.id
      }
      ;[insertedRow] = await adapter.insert({
        db,
        tableName,
        values: rowToInsert.row,
      })
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
        selectsToInsert[selectTableName] = []

        selectRows.forEach((row) => {
          if (typeof row.parent === 'undefined') {
            row.parent = insertedRow.id
          }

          selectsToInsert[selectTableName].push(row)
        })
      })
    }

    // If there are blocks, add parent to each, and then
    // store by table name and rows
    Object.keys(rowToInsert.blocks).forEach((blockName) => {
      rowToInsert.blocks[blockName].forEach((blockRow) => {
        blockRow.row._parentID = insertedRow.id
        if (!blocksToInsert[blockName]) {
          blocksToInsert[blockName] = []
        }
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
      const localeTableName = `${tableName}${adapter.localesSuffix}`
      const localeTable = adapter.tables[`${tableName}${adapter.localesSuffix}`]

      if (operation === 'update') {
        await adapter.deleteWhere({
          db,
          tableName: localeTableName,
          where: eq(localeTable._parentID, insertedRow.id),
        })
      }

      await adapter.insert({
        db,
        tableName: localeTableName,
        values: localesToInsert,
      })
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
      await adapter.insert({
        db,
        tableName: relationshipsTableName,
        values: relationsToInsert,
      })
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
      await adapter.insert({
        db,
        tableName: textsTableName,
        values: textsToInsert,
      })
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
      await adapter.insert({
        db,
        tableName: numbersTableName,
        values: numbersToInsert,
      })
    }

    // //////////////////////////////////
    // INSERT BLOCKS
    // //////////////////////////////////

    const insertedBlockRows: Record<string, Record<string, unknown>[]> = {}

    if (operation === 'update') {
      for (const blockName of rowToInsert.blocksToDelete) {
        const blockTableName = adapter.tableNameMap.get(`${tableName}_blocks_${blockName}`)
        const blockTable = adapter.tables[blockTableName]
        await adapter.deleteWhere({
          db,
          tableName: blockTableName,
          where: eq(blockTable._parentID, insertedRow.id),
        })
      }
    }

    // When versions are enabled, this is used to track mapping between blocks/arrays ObjectID to their numeric generated representation, then we use it for nested to arrays/blocks select hasMany in versions.
    const arraysBlocksUUIDMap: Record<string, number | string> = {}

    for (const [blockName, blockRows] of Object.entries(blocksToInsert)) {
      const blockTableName = adapter.tableNameMap.get(`${tableName}_blocks_${blockName}`)
      insertedBlockRows[blockName] = await adapter.insert({
        db,
        tableName: blockTableName,
        values: blockRows.map(({ row }) => row),
      })

      insertedBlockRows[blockName].forEach((row, i) => {
        blockRows[i].row = row
        if (
          typeof row._uuid === 'string' &&
          (typeof row.id === 'string' || typeof row.id === 'number')
        ) {
          arraysBlocksUUIDMap[row._uuid] = row.id
        }
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
        await adapter.insert({
          db,
          tableName: `${blockTableName}${adapter.localesSuffix}`,
          values: blockLocaleRowsToInsert,
        })
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        db,
        parentRows: insertedBlockRows[blockName],
        uuidMap: arraysBlocksUUIDMap,
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
      uuidMap: arraysBlocksUUIDMap,
    })

    // //////////////////////////////////
    // INSERT hasMany SELECTS
    // //////////////////////////////////

    for (const [selectTableName, tableRows] of Object.entries(selectsToInsert)) {
      const selectTable = adapter.tables[selectTableName]
      if (operation === 'update') {
        await adapter.deleteWhere({
          db,
          tableName: selectTableName,
          where: eq(selectTable.parent, insertedRow.id),
        })
      }

      if (Object.keys(arraysBlocksUUIDMap).length > 0) {
        tableRows.forEach((row: any) => {
          if (row.parent in arraysBlocksUUIDMap) {
            row.parent = arraysBlocksUUIDMap[row.parent]
          }
        })
      }

      if (tableRows.length) {
        await adapter.insert({
          db,
          tableName: selectTableName,
          values: tableRows,
        })
      }
    }

    // //////////////////////////////////
    // Error Handling
    // //////////////////////////////////
  } catch (error) {
    if (error.code === '23505') {
      let fieldName: null | string = null
      // We need to try and find the right constraint for the field but if we can't we fallback to a generic message
      if (adapter.fieldConstraints?.[tableName]) {
        if (adapter.fieldConstraints[tableName]?.[error.constraint]) {
          fieldName = adapter.fieldConstraints[tableName]?.[error.constraint]
        } else {
          const replacement = `${tableName}_`

          if (error.constraint.includes(replacement)) {
            const replacedConstraint = error.constraint.replace(replacement, '')

            if (replacedConstraint && adapter.fieldConstraints[tableName]?.[replacedConstraint]) {
              fieldName = adapter.fieldConstraints[tableName][replacedConstraint]
            }
          }
        }
      }

      if (!fieldName) {
        // Last case scenario we extract the key and value from the detail on the error
        const detail = error.detail
        const regex = /Key \(([^)]+)\)=\(([^)]+)\)/
        const match = detail.match(regex)

        if (match) {
          const key = match[1]

          fieldName = key
        }
      }

      throw new ValidationError(
        {
          id,
          errors: [
            {
              message: req?.t ? req.t('error:valueMustBeUnique') : 'Value must be unique',
              path: fieldName,
            },
          ],
          req,
        },
        req?.t,
      )
    } else {
      throw error
    }
  }

  if (ignoreResult === 'idOnly') {
    return { id: insertedRow.id } as T
  }

  if (ignoreResult) {
    return data as T
  }

  // //////////////////////////////////
  // RETRIEVE NEWLY UPDATED ROW
  // //////////////////////////////////

  const findManyArgs = buildFindManyArgs({
    adapter,
    depth: 0,
    fields,
    joinQuery: false,
    select,
    tableName,
  })

  findManyArgs.where = eq(adapter.tables[tableName].id, insertedRow.id)

  const doc = await db.query[tableName].findFirst(findManyArgs)

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  const result = transform<T>({
    adapter,
    config: adapter.payload.config,
    data: doc,
    fields,
    joinQuery: false,
    tableName,
  })

  return result
}
