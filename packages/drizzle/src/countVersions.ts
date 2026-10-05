import type { CountVersions, SanitizedCollectionConfig } from 'payload'

import { and } from 'drizzle-orm'
import {
  buildVersionCollectionFields,
  resolveBranchReadState,
  resolveBranchVersionHistoryQuery,
  rewriteBranchVersionParents,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildBranchVisibility } from './queries/buildBranchVisibility.js'
import { buildQuery } from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'

export const countVersions: CountVersions = async function countVersions(
  this: DrizzleAdapter,
  { branch, collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)
  const branchReadState = resolveBranchReadState({ branch, collectionSlug: collection, req })

  // Shares the list's predicate so the count in the Versions tab can never
  // disagree with the rows the Versions view actually renders.
  const branchedWhere = branchReadState.useBranching
    ? rewriteBranchVersionParents(whereArg)
    : await resolveBranchVersionHistoryQuery({
        branch,
        collectionSlug: collection,
        req,
        where: whereArg,
      })

  const { joins, where: queryWhere } = buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: branchedWhere,
  })
  const branchVisibilityWhere = branchReadState.useBranching
    ? buildBranchVisibility({
        adapter: this,
        branch: branchReadState.branch,
        canonicalIDExpression: undefined,
        collectionSlug: collection,
        mode: 'history',
        table: this.tables[tableName],
      })
    : undefined
  const where = branchVisibilityWhere ? and(queryWhere, branchVisibilityWhere) : queryWhere

  const db = await getTransaction(this, req)

  const countResult = await this.countDistinct({
    db,
    joins,
    tableName,
    where,
  })

  return { totalDocs: countResult }
}
