import type { Field, SanitizedConfig, UpdateGlobalArgs } from 'payload'

import { deepCopyObjectSimple, resolveBranchGlobalWrite } from 'payload'
import { traverseFields } from 'payload/shared'
import toSnakeCase from 'to-snake-case'
import { v4 as uuid } from 'uuid'

import type { DrizzleAdapter } from './types.js'

import { findGlobal } from './findGlobal.js'
import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'

type BranchUpdateGlobalArgs = {
  branchConflictData?: Record<string, unknown>
} & UpdateGlobalArgs

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, branch, branchConflictData, data, req, returning, select }: BranchUpdateGlobalArgs,
): Promise<T> {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const db = getPrimaryDb(this, await getTransaction(this, req))

  const writeBranch = resolveBranchGlobalWrite({ branch, globalSlug: slug, req })

  // Each global has its own table holding one row per branch. On a branch the
  // write targets that branch's row, seeded from main's content the first time
  // the global is touched.
  const rows = await db.query[tableName].findMany({})
  const existingGlobal = writeBranch
    ? rows.find((row: Record<string, unknown>) => row._branch === writeBranch)
    : rows.find((row: Record<string, unknown>) => (row._branch ?? 'main') === 'main')

  const mainRow = rows.find((row: Record<string, unknown>) => (row._branch ?? 'main') === 'main')
  const mainGlobal =
    writeBranch && !existingGlobal
      ? await findGlobal.call(this, {
          slug,
          branch: false,
          locale: 'all',
          req,
          where:
            typeof mainRow?.id === 'string' || typeof mainRow?.id === 'number'
              ? { id: { equals: mainRow.id } }
              : { _branch: { equals: 'main' } },
        })
      : null
  const mainSource = mainGlobal && Object.keys(mainGlobal).length ? mainGlobal : (mainRow ?? {})

  const { id: _mainID, _branch: _mainBranch, globalType: _mainGlobalType, ...mainData } = mainSource
  const branchData = writeBranch ? { ...data, _branch: writeBranch } : data
  const branchConflictWriteData = writeBranch
    ? { ...(branchConflictData ?? data), _branch: writeBranch }
    : data
  const dataToWrite =
    writeBranch && !existingGlobal
      ? copyGlobalDataWithFreshRowIDs({
          config: this.payload.config,
          data: { ...mainData, ...branchData },
          fields: globalConfig.fields,
        })
      : branchData
  const conflictDataToWrite =
    writeBranch && !existingGlobal
      ? copyGlobalDataWithFreshRowIDs({
          config: this.payload.config,
          data: branchConflictWriteData,
          fields: globalConfig.fields,
        })
      : branchConflictWriteData

  const result = await upsertRow<{ globalType: string } & T>({
    ...(writeBranch
      ? {
          operation: 'update' as const,
          ...(!existingGlobal ? { upsertConflictData: conflictDataToWrite } : {}),
          upsertTarget: this.tables[tableName]._branch,
        }
      : existingGlobal
        ? { id: existingGlobal.id, operation: 'update' as const }
        : { operation: 'create' as const }),
    adapter: this,
    data: dataToWrite,
    db,
    fields: globalConfig.flattenedFields,
    globalSlug: slug,
    ignoreResult: returning === false,
    req,
    select,
    tableName,
  })

  if (returning === false) {
    return null
  }

  result.globalType = slug

  return result
}

const copyGlobalDataWithFreshRowIDs = ({
  config,
  data,
  fields,
}: {
  config: SanitizedConfig
  data: Record<string, unknown>
  fields: Field[]
}): Record<string, unknown> => {
  const clonedData = deepCopyObjectSimple(data)

  traverseFields({
    callback: ({ field, ref }) => {
      if (
        (field.type !== 'array' && field.type !== 'blocks') ||
        !('name' in field) ||
        !field.name ||
        !ref ||
        typeof ref !== 'object'
      ) {
        return
      }

      const value = (ref as Record<string, unknown>)[field.name]
      const rekeyRows = (rows: unknown) => {
        if (!Array.isArray(rows)) {
          return
        }

        for (const row of rows) {
          if (row && typeof row === 'object' && 'id' in row) {
            const rowData = row as Record<string, unknown>

            rowData.id = typeof rowData.id === 'string' ? uuid() : undefined
          }
        }
      }

      if (Array.isArray(value)) {
        rekeyRows(value)
      } else if (value && typeof value === 'object') {
        for (const localizedRows of Object.values(value as Record<string, unknown>)) {
          rekeyRows(localizedRows)
        }
      }
    },
    config,
    fields,
    fillEmpty: false,
    ref: clonedData,
  })

  return clonedData
}
