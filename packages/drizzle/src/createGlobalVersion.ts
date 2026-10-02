import type { CreateGlobalVersionArgs, JsonObject, TypeWithVersion } from 'payload'

import { sql } from 'drizzle-orm'
import { buildVersionGlobalFields, MAIN_BRANCH, resolveBranch } from 'payload'
import { hasDraftsEnabled } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createGlobalVersion<T extends JsonObject = JsonObject>(
  this: DrizzleAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    publishedLocale,
    req,
    returning,
    select,
    snapshot,
    updatedAt,
    versionData,
  }: CreateGlobalVersionArgs,
): Promise<TypeWithVersion<T>> {
  const global = this.payload.globals.config.find(({ slug }) => slug === globalSlug)

  const tableName = this.tableNameMap.get(`_${toSnakeCase(global.slug)}${this.versionsSuffix}`)

  const db = getPrimaryDb(this, await getTransaction(this, req))

  const isBranchable = Boolean(req?.payload?.config?.branching?.branchableGlobals?.has(globalSlug))
  const versionBranch = isBranchable ? resolveBranch(req as never) : MAIN_BRANCH

  const result = await upsertRow<TypeWithVersion<T>>({
    adapter: this,
    data: {
      autosave,
      createdAt,
      latest: true,
      ...(isBranchable ? { _branch: versionBranch } : {}),
      publishedLocale,
      snapshot,
      updatedAt,
      version: versionData,
    },
    db,
    fields: buildVersionGlobalFields(this.payload.config, global, true),
    globalSlug,
    ignoreResult: returning === false ? 'idOnly' : false,
    operation: 'create',
    req,
    select,
    tableName,
  })

  const table = this.tables[tableName]
  if (hasDraftsEnabled(global)) {
    // Scoped by `_branch` when the global is branchable. Global versions have no
    // `parent` to separate streams by — every version of a global shares one —
    // so an unscoped clear would wipe main's latest flag from a branch.
    await this.execute({
      db,
      sql: isBranchable
        ? sql`
          UPDATE ${table}
          SET latest = false
          WHERE ${table.id} != ${result.id}
            AND ${table._branch} = ${versionBranch};
        `
        : sql`
          UPDATE ${table}
          SET latest = false
          WHERE ${table.id} != ${result.id};
        `,
    })
  }

  if (returning === false) {
    return null
  }

  return result
}
