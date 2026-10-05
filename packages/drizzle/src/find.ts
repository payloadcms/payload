import type { Find, SanitizedCollectionConfig } from 'payload'

import {
  applyBranchIDProjection,
  resolveBranchQuery,
  resolveBranchReadState,
  rewriteBranchIDs,
  withBranchIDSelect,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const find: Find = async function find(
  this: DrizzleAdapter,
  {
    branch,
    collection,
    draftsEnabled,
    joins,
    limit,
    locale,
    page = 1,
    pagination,
    req,
    select,
    sort: sortArg,
    where,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const branchReadState = resolveBranchReadState({
    branch,
    collectionSlug: collectionConfig.slug,
    req,
  })
  const branchedWhere = branchReadState.useBranching
    ? rewriteBranchIDs(where)
    : await resolveBranchQuery({
        branch,
        collectionSlug: collectionConfig.slug,
        req,
        where,
      })

  const result = await findMany({
    adapter: this,
    branchVisibility: branchReadState.useBranching
      ? { branch: branchReadState.branch, collectionSlug: collectionConfig.slug }
      : undefined,
    collectionSlug: collectionConfig.slug,
    draftsEnabled,
    fields: collectionConfig.flattenedFields,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select: withBranchIDSelect({ branch, collectionSlug: collectionConfig.slug, req, select }),
    sort,
    tableName,
    where: branchedWhere,
  })

  applyBranchIDProjection({
    branch,
    collectionSlug: collectionConfig.slug,
    docs: result.docs as Record<string, unknown>[],
    req,
  })

  return result
}
