import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { SelectedFields } from 'drizzle-orm/sqlite-core'
import type { TypeWithID } from 'payload'

import { and, desc, eq, isNull, or } from 'drizzle-orm'

import type { BlockRowToInsert } from '../transform/write/types.js'
import type { Args } from './types.js'

type RelationshipRow = {
  [key: string]: number | string | undefined // For relationship ID columns like categoriesID, moviesID, etc.
  id?: number | string
  locale?: string
  order: number
  parent: number | string // Drizzle table uses 'parent' key
  path: string
}

import { buildFindManyArgs } from '../find/buildFindManyArgs.js'
import { transform } from '../transform/read/index.js'
import { transformForWrite } from '../transform/write/index.js'
import { deleteExistingArrayRows } from './deleteExistingArrayRows.js'
import { deleteExistingRowsByPath } from './deleteExistingRowsByPath.js'
import { handleUpsertError } from './handleUpsertError.js'
import { insertArrays } from './insertArrays.js'
import { shouldUseOptimizedUpsertRow } from './shouldUseOptimizedUpsertRow.js'

/**
 * If `id` is provided, it will update the row with that ID.
 * If `where` is provided, it will update the row that matches the `where`
 * If neither `id` nor `where` is provided, it will create a new row.
 *
 * adapter function replaces the entire row and does not support partial updates.
 */
export const upsertRow = async <T extends Record<string, unknown> | TypeWithID>({
  id,
  adapter,
  collectionSlug,
  data,
  db,
  fields,
  globalSlug,
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
  if (operation === 'create' && !data.createdAt) {
    data.createdAt = new Date().toISOString()
  }

  let insertedRow: Record<string, unknown> = { id }
  if (id && shouldUseOptimizedUpsertRow({ data, fields })) {
    try {
      const transformedForWrite = transformForWrite({
        adapter,
        data,
        enableAtomicWrites: true,
        fields,
        tableName,
      })
      const { row } = transformedForWrite
      const { arraysToPush } = transformedForWrite

      const drizzle = db as LibSQLDatabase

      // First, handle $push arrays

      if (arraysToPush && Object.keys(arraysToPush)?.length) {
        await insertArrays({
          adapter,
          arrays: [arraysToPush],
          db,
          parentRows: [insertedRow],
          uuidMap: {},
        })
      }

      // If row.updatedAt is not set, delete it to avoid triggering hasDataToUpdate. `updatedAt` may be explicitly set to null to
      // disable triggering hasDataToUpdate.
      if (typeof row.updatedAt === 'undefined' || row.updatedAt === null) {
        delete row.updatedAt
      }

      const hasDataToUpdate = row && Object.keys(row)?.length

      // Then, handle regular row update
      if (ignoreResult) {
        if (hasDataToUpdate) {
          // Only update row if there is something to update.
          // Example: if the data only consists of a single $push, calling insertArrays is enough - we don't need to update the row.
          await drizzle
            .update(adapter.tables[tableName])
            .set(row)
            .where(eq(adapter.tables[tableName].id, id))
        }
        return ignoreResult === 'idOnly' ? ({ id } as T) : null
      }

      const findManyArgs = buildFindManyArgs({
        adapter,
        depth: 0,
        fields,
        joinQuery: false,
        select,
        tableName,
      })

      const findManyKeysLength = Object.keys(findManyArgs).length
      const hasOnlyColumns = Object.keys(findManyArgs.columns || {}).length > 0

      if (!hasDataToUpdate) {
        // Nothing to update => just fetch current row and return
        findManyArgs.where = eq(adapter.tables[tableName].id, insertedRow.id)

        const doc = await db.query[tableName].findFirst(findManyArgs)

        return transform<T>({
          adapter,
          config: adapter.payload.config,
          data: doc,
          fields,
          joinQuery: false,
          tableName,
        })
      }

      if (findManyKeysLength === 0 || hasOnlyColumns) {
        // Optimization - No need for joins => can simply use returning(). This is optimal for very simple collections
        // without complex fields that live in separate tables like blocks, arrays, relationships, etc.

        const selectedFields: SelectedFields = {}
        if (hasOnlyColumns) {
          for (const [column, enabled] of Object.entries(findManyArgs.columns)) {
            if (enabled) {
              selectedFields[column] = adapter.tables[tableName][column]
            }
          }
        }

        const docs = await drizzle
          .update(adapter.tables[tableName])
          .set(row)
          .where(eq(adapter.tables[tableName].id, id))
          .returning(Object.keys(selectedFields).length ? selectedFields : undefined)

        return transform<T>({
          adapter,
          config: adapter.payload.config,
          data: docs[0],
          fields,
          joinQuery: false,
          tableName,
        })
      }

      // DB Update that needs the result, potentially with joins => need to update first, then find. returning() does not work with joins.

      await drizzle
        .update(adapter.tables[tableName])
        .set(row)
        .where(eq(adapter.tables[tableName].id, id))

      findManyArgs.where = eq(adapter.tables[tableName].id, insertedRow.id)

      const doc = await db.query[tableName].findFirst(findManyArgs)

      return transform<T>({
        adapter,
        config: adapter.payload.config,
        data: doc,
        fields,
        joinQuery: false,
        tableName,
      })
    } catch (error) {
      handleUpsertError({ id, adapter, collectionSlug, error, globalSlug, req, tableName })
    }
  }
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert = transformForWrite({
    adapter,
    data,
    enableAtomicWrites: false,
    fields,
    path,
    tableName,
  })

  // First, we insert the main row
  try {
    if (operation === 'update') {
      const target = upsertTarget || adapter.tables[tableName].id

      // Check if we only have relationship operations and no main row data to update
      // Exclude timestamp-only updates when we only have relationship operations
      const rowKeys = Object.keys(rowToInsert.row)
      const hasMainRowData =
        rowKeys.length > 0 && !rowKeys.every((key) => key === 'updatedAt' || key === 'createdAt')

      if (hasMainRowData) {
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
        // No main row data to update, just use the existing ID
        insertedRow = { id }
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
    Object.keys(rowToInsert.blocks).forEach((tableName) => {
      rowToInsert.blocks[tableName].forEach((blockRow) => {
        blockRow.row._parentID = insertedRow.id
        if (!blocksToInsert[tableName]) {
          blocksToInsert[tableName] = []
        }
        if (blockRow.row.uuid) {
          delete blockRow.row.uuid
        }
        blocksToInsert[tableName].push(blockRow)
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
      // Filter out specific item deletions (those with itemToRemove) from general path deletions
      const generalRelationshipDeletes = rowToInsert.relationshipsToDelete.filter(
        (rel) => !('itemToRemove' in rel),
      )

      await deleteExistingRowsByPath({
        adapter,
        db,
        localeColumnName: 'locale',
        parentColumnName: 'parent',
        parentID: insertedRow.id,
        pathColumnName: 'path',
        rows: [...relationsToInsert, ...generalRelationshipDeletes],
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
    // HANDLE RELATIONSHIP $push OPERATIONS
    // //////////////////////////////////

    if (rowToInsert.relationshipsToAppend.length > 0) {
      // Prepare all relationships for batch insert (order will be set after max query)
      const relationshipsToInsert = rowToInsert.relationshipsToAppend.map((rel) => {
        const parentId = id || insertedRow.id
        const row: Record<string, unknown> = {
          parent: parentId as number | string, // Use 'parent' key for Drizzle table
          path: rel.path,
        }

        // Only add locale if this relationship table has a locale column
        const relationshipTable = adapter.rawTables[relationshipsTableName]
        if (rel.locale && relationshipTable && relationshipTable.columns.locale) {
          row.locale = rel.locale
        }

        if (rel.relationTo) {
          // Use camelCase key for Drizzle table (e.g., categoriesID not categories_id)
          row[`${rel.relationTo}ID`] = rel.value
        }

        return row
      })

      if (relationshipsToInsert.length > 0) {
        // Check for potential duplicates
        const relationshipTable = adapter.tables[relationshipsTableName]

        if (relationshipTable) {
          // Build conditions only if we have relationships to check
          if (relationshipsToInsert.length === 0) {
            return // No relationships to insert
          }

          const conditions = relationshipsToInsert.map((row: RelationshipRow) => {
            const parts = [
              eq(relationshipTable.parent, row.parent),
              eq(relationshipTable.path, row.path),
            ]

            // Add locale condition
            if (row.locale !== undefined && relationshipTable.locale) {
              parts.push(eq(relationshipTable.locale, row.locale))
            } else if (relationshipTable.locale) {
              parts.push(isNull(relationshipTable.locale))
            }

            // Add all relationship ID matches using schema fields
            for (const [key, value] of Object.entries(row)) {
              if (key.endsWith('ID') && value != null) {
                const column = relationshipTable[key]
                if (column && typeof column === 'object') {
                  parts.push(eq(column, value))
                }
              }
            }

            return and(...parts)
          })

          // Get both existing relationships AND max order in a single query
          let existingRels: Record<string, unknown>[] = []
          let maxOrder = 0

          if (conditions.length > 0) {
            // Query for existing relationships
            existingRels = await (db as any)
              .select()
              .from(relationshipTable)
              .where(or(...conditions))
          }

          // Get max order for this parent across all paths in a single query
          const parentId = id || insertedRow.id
          const maxOrderResult = await (db as any)
            .select({ maxOrder: relationshipTable.order })
            .from(relationshipTable)
            .where(eq(relationshipTable.parent, parentId))
            .orderBy(desc(relationshipTable.order))
            .limit(1)

          if (maxOrderResult.length > 0 && maxOrderResult[0].maxOrder) {
            maxOrder = maxOrderResult[0].maxOrder
          }

          // Set order values for all relationships based on max order
          relationshipsToInsert.forEach((row, index) => {
            row.order = maxOrder + index + 1
          })

          // Filter out relationships that already exist
          const relationshipsToActuallyInsert = relationshipsToInsert.filter((newRow) => {
            return !existingRels.some((existingRow: Record<string, unknown>) => {
              // Check if this relationship already exists
              let matches = existingRow.parent === newRow.parent && existingRow.path === newRow.path

              if (newRow.locale !== undefined) {
                matches = matches && existingRow.locale === newRow.locale
              }

              // Check relationship value matches - convert to camelCase for comparison
              for (const key of Object.keys(newRow)) {
                if (key.endsWith('ID')) {
                  // Now using camelCase keys
                  matches = matches && existingRow[key] === newRow[key]
                }
              }

              return matches
            })
          })

          // Insert only non-duplicate relationships
          if (relationshipsToActuallyInsert.length > 0) {
            await adapter.insert({
              db,
              tableName: relationshipsTableName,
              values: relationshipsToActuallyInsert,
            })
          }
        }
      }
    }

    // //////////////////////////////////
    // HANDLE RELATIONSHIP $remove OPERATIONS
    // //////////////////////////////////

    if (rowToInsert.relationshipsToDelete.some((rel) => 'itemToRemove' in rel)) {
      const relationshipTable = adapter.tables[relationshipsTableName]

      if (relationshipTable) {
        for (const relToDelete of rowToInsert.relationshipsToDelete) {
          if ('itemToRemove' in relToDelete && relToDelete.itemToRemove) {
            const item = relToDelete.itemToRemove
            const parentId = (id || insertedRow.id) as number | string

            const conditions = [
              eq(relationshipTable.parent, parentId),
              eq(relationshipTable.path, relToDelete.path),
            ]

            // Add locale condition if this relationship table has a locale column
            if (adapter.rawTables[relationshipsTableName]?.columns.locale) {
              if (relToDelete.locale) {
                conditions.push(eq(relationshipTable.locale, relToDelete.locale))
              } else {
                conditions.push(isNull(relationshipTable.locale))
              }
            }

            // Handle polymorphic vs simple relationships
            if (typeof item === 'object' && 'relationTo' in item) {
              // Polymorphic relationship - convert to camelCase key
              const camelKey = `${item.relationTo}ID`
              if (relationshipTable[camelKey]) {
                conditions.push(eq(relationshipTable[camelKey], item.value))
              }
            } else if (relToDelete.relationTo) {
              // Simple relationship - convert to camelCase key
              const camelKey = `${relToDelete.relationTo}ID`
              if (relationshipTable[camelKey]) {
                conditions.push(eq(relationshipTable[camelKey], item))
              }
            }

            // Execute DELETE using Drizzle query builder
            await adapter.deleteWhere({
              db,
              tableName: relationshipsTableName,
              where: and(...conditions),
            })
          }
        }
      }
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
        rows: [...textsToInsert, ...rowToInsert.textsToDelete],
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
        rows: [...numbersToInsert, ...rowToInsert.numbersToDelete],
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
      for (const tableName of rowToInsert.blocksToDelete) {
        const blockTable = adapter.tables[tableName]
        await adapter.deleteWhere({
          db,
          tableName,
          where: eq(blockTable._parentID, insertedRow.id),
        })
      }
    }

    // When versions are enabled, adapter is used to track mapping between blocks/arrays ObjectID to their numeric generated representation, then we use it for nested to arrays/blocks select hasMany in versions.
    const arraysBlocksUUIDMap: Record<string, number | string> = {}

    for (const [tableName, blockRows] of Object.entries(blocksToInsert)) {
      insertedBlockRows[tableName] = await adapter.insert({
        db,
        tableName,
        values: blockRows.map(({ row }) => row),
      })

      insertedBlockRows[tableName].forEach((row, i) => {
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
          tableName: `${tableName}${adapter.localesSuffix}`,
          values: blockLocaleRowsToInsert,
        })
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        db,
        parentRows: insertedBlockRows[tableName],
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
      arrays: [rowToInsert.arrays, rowToInsert.arraysToPush],
      db,
      parentRows: [insertedRow, insertedRow],
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
        tableRows.forEach((row: RelationshipRow) => {
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
  } catch (error) {
    handleUpsertError({ id, adapter, collectionSlug, error, globalSlug, req, tableName })
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
