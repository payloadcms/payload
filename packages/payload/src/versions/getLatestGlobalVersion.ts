import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Document, Payload, PayloadRequest, Where } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { hasWhereAccessResult } from '../auth/types.js'
import { branchField } from '../branching/types.js'
import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { appendGlobalVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'

type Args = {
  config: SanitizedGlobalConfig
  locale?: string
  payload: Payload
  published?: boolean
  req?: PayloadRequest
  slug: string
  /** Filters stored global and global-version rows without changing access-query field paths. */
  storageWhere?: Where
  where: Where
}

type Result = {
  global: Document
  globalExists: boolean
  hasLiveGlobal: boolean
}

export const getLatestGlobalVersion = async ({
  slug,
  config,
  locale,
  payload,
  published,
  req,
  storageWhere,
  where,
}: Args): Promise<Result> => {
  let latestVersion: TypeWithVersion<Document> | undefined

  const whereQuery = published
    ? { 'version._status': { equals: 'published' } }
    : { latest: { equals: true } }
  const scopedVersionQuery = storageWhere
    ? combineQueries(whereQuery as unknown as Where, storageWhere)
    : (whereQuery as unknown as Where)

  if (hasDraftsEnabled(config)) {
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale: locale || req?.locale || undefined,
        pagination: false,
        req,
        where: scopedVersionQuery,
      })
    ).docs[0]
  }

  const scopedLiveGlobal = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where: storageWhere,
  })
  const hasLiveGlobal = Boolean(scopedLiveGlobal && Object.keys(scopedLiveGlobal).length > 0)
  const globalExists = Boolean(latestVersion) || hasLiveGlobal

  if (latestVersion) {
    let accessibleLatestVersion: TypeWithVersion<Document> | undefined = latestVersion

    if (hasWhereAccessResult(where)) {
      const versionAccessQuery = combineQueries(appendGlobalVersionToQueryKey(where), {
        id: { equals: latestVersion.id },
      })
      const scopedVersionAccessQuery = storageWhere
        ? combineQueries(versionAccessQuery, storageWhere)
        : versionAccessQuery

      accessibleLatestVersion = (
        await payload.db.findGlobalVersions({
          global: slug,
          limit: 1,
          locale: locale || req?.locale || undefined,
          pagination: false,
          req,
          where: scopedVersionAccessQuery,
        })
      ).docs[0]
    }

    if (!accessibleLatestVersion) {
      return {
        global: {},
        globalExists,
        hasLiveGlobal,
      }
    }

    if (!accessibleLatestVersion.version.createdAt) {
      accessibleLatestVersion.version.createdAt = accessibleLatestVersion.createdAt
    }

    if (!accessibleLatestVersion.version.updatedAt) {
      accessibleLatestVersion.version.updatedAt = accessibleLatestVersion.updatedAt
    }

    return {
      global: accessibleLatestVersion.version,
      globalExists,
      hasLiveGlobal,
    }
  }

  if (!hasWhereAccessResult(where) || !hasLiveGlobal) {
    return {
      global: scopedLiveGlobal,
      globalExists,
      hasLiveGlobal,
    }
  }

  const liveGlobalBranch = scopedLiveGlobal[branchField]
  const exactLiveStorageWhere =
    typeof liveGlobalBranch === 'string'
      ? combineQueries(storageWhere ?? {}, { [branchField]: { equals: liveGlobalBranch } })
      : storageWhere
  const liveAccessQuery = exactLiveStorageWhere
    ? combineQueries(where, exactLiveStorageWhere)
    : where
  const accessibleLiveGlobal = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where: liveAccessQuery,
  })

  return {
    global: accessibleLiveGlobal,
    globalExists,
    hasLiveGlobal,
  }
}
