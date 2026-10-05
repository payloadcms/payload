import type { FindVersions, SanitizedCollectionConfig } from 'payload'

import {
  buildVersionCollectionFields,
  projectBranchVersionParents,
  resolveBranchReadState,
  resolveBranchVersionHistoryQuery,
  rewriteBranchVersionParents,
  withBranchVersionSelect,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findVersions: FindVersions = async function findVersions(
  this: DrizzleAdapter,
  { branch, collection, limit, locale, page, pagination, req, select, sort: sortArg, where },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const branchReadState = resolveBranchReadState({ branch, collectionSlug: collection, req })
  const branchedWhere = branchReadState.useBranching
    ? rewriteBranchVersionParents(where)
    : await resolveBranchVersionHistoryQuery({
        branch,
        collectionSlug: collection,
        req,
        where,
      })

  const result = await findMany({
    adapter: this,
    branchVisibility: branchReadState.useBranching
      ? { branch: branchReadState.branch, collectionSlug: collection, mode: 'history' }
      : undefined,
    fields,
    joins: false,
    limit,
    locale,
    page,
    pagination,
    req,
    select: withBranchVersionSelect({ branch, collectionSlug: collection, req, select }),
    sort,
    tableName,
    where: branchedWhere,
  })

  // A branch version hangs off the shadow row, so its `parent` is that row rather
  // than the document the history belongs to.
  projectBranchVersionParents(result.docs as Record<string, unknown>[])

  return result
}
