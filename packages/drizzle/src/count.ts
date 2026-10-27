import type { Count, SanitizedCollectionConfig } from 'payload'

import { and } from 'drizzle-orm'
import { resolveBranchQuery, resolveBranchReadState, rewriteBranchIDs } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildBranchVisibility } from './queries/buildBranchVisibility.js'
import { buildQuery } from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'

export const count: Count = async function count(
  this: DrizzleAdapter,
  { branch, collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))
  const branchReadState = resolveBranchReadState({
    branch,
    collectionSlug: collectionConfig.slug,
    req,
  })
  const branchedWhere = branchReadState.useBranching
    ? rewriteBranchIDs(whereArg)
    : await resolveBranchQuery({
        branch,
        collectionSlug: collectionConfig.slug,
        req,
        where: whereArg,
      })

  const { joins, where: queryWhere } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale,
    req,
    tableName,
    where: branchedWhere,
  })
  const branchVisibilityWhere = branchReadState.useBranching
    ? buildBranchVisibility({
        adapter: this,
        branch: branchReadState.branch,
        collectionSlug: collectionConfig.slug,
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
