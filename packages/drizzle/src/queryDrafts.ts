import type { QueryDrafts, SanitizedCollectionConfig } from 'payload'

import {
  buildVersionCollectionFields,
  combineQueries,
  projectBranchVersionParent,
  resolveBranchReadState,
  resolveBranchVersionQuery,
  rewriteBranchVersionParents,
  withBranchVersionSelect,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: DrizzleAdapter,
  { collection, joins, limit, locale, page = 1, pagination, req, select, sort, where },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const branchReadState = resolveBranchReadState({ collectionSlug: collection, req })
  const branchedWhere = branchReadState.useBranching
    ? rewriteBranchVersionParents(where)
    : await resolveBranchVersionQuery({
        collectionSlug: collection,
        req,
        where,
      })

  const combinedWhere = combineQueries({ latest: { equals: true } }, branchedWhere ?? {})

  const result = await findMany({
    adapter: this,
    branchVisibility: branchReadState.useBranching
      ? { branch: branchReadState.branch, collectionSlug: collection }
      : undefined,
    collectionSlug: collection,
    fields,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select: withBranchVersionSelect({ collectionSlug: collection, req, select }),
    sort,
    tableName,
    versions: true,
    where: combinedWhere,
  })

  return {
    ...result,
    docs: result.docs.map((doc) => {
      // A branch version's `parent` is the shadow row's primary key, so the
      // canonical document ID comes from `_branchParent` when present.
      doc = {
        id: projectBranchVersionParent(doc),
        ...doc.version,
      }

      return doc
    }),
  }
}
