import type { FindGlobal } from 'payload'

import {
  branchGlobalNeedsBothRows,
  pickBranchGlobal,
  resolveBranch,
  resolveBranchGlobalQuery,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: DrizzleAdapter,
  { slug, branch, locale, req, select, where },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)

  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const needsBoth = branchGlobalNeedsBothRows({ branch, globalSlug: slug, req })

  const { docs } = await findMany({
    adapter: this,
    fields: globalConfig.flattenedFields,
    limit: needsBoth ? 2 : 1,
    locale,
    pagination: false,
    req,
    select,
    tableName,
    where: resolveBranchGlobalQuery({ branch, globalSlug: slug, req, where }),
  })

  const doc = needsBoth
    ? pickBranchGlobal(docs, (branch as string) || resolveBranch(req as never))
    : docs[0]

  if (doc) {
    doc.globalType = slug
    return doc
  }

  return {}
}
