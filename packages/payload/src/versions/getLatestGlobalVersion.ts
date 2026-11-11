import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Document, Payload, PayloadRequest, Where } from '../types/index.js'
import type { TypeWithVersion } from './types.js'

import { hasWhereAccessResult } from '../auth/types.js'
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
  storageWhere?: Where
  where: Where
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
}: Args): Promise<{ global: Document; globalExists: boolean; latestVersionExists: boolean }> => {
  let latestVersion: TypeWithVersion<Document> | undefined

  const whereQuery = published
    ? { 'version._status': { equals: 'published' } }
    : { latest: { equals: true } }

  if (hasDraftsEnabled(config)) {
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale: locale || req?.locale || undefined,
        pagination: false,
        req,
        where: storageWhere
          ? combineQueries(whereQuery as unknown as Where, storageWhere)
          : (whereQuery as unknown as Where),
      })
    ).docs[0]
  }

  const global = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where: storageWhere ? combineQueries(where, storageWhere) : where,
  })
  const existingGlobal = hasWhereAccessResult(where)
    ? await payload.db.findGlobal({
        slug,
        locale,
        req,
        where: storageWhere,
      })
    : global
  const globalExists = Boolean(existingGlobal && Object.keys(existingGlobal).length > 0)
  const latestVersionExists = Boolean(latestVersion)

  if (!latestVersion) {
    return {
      global,
      globalExists,
      latestVersionExists,
    }
  }

  if (hasWhereAccessResult(where)) {
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale: locale || req?.locale || undefined,
        pagination: false,
        req,
        where: combineQueries(
          combineQueries(appendGlobalVersionToQueryKey(where), {
            id: { equals: latestVersion.id },
          }),
          storageWhere ?? {},
        ),
      })
    ).docs[0]

    if (!latestVersion) {
      return {
        global: {},
        globalExists,
        latestVersionExists,
      }
    }
  }

  if (!latestVersion.version.createdAt) {
    latestVersion.version.createdAt = latestVersion.createdAt
  }

  if (!latestVersion.version.updatedAt) {
    latestVersion.version.updatedAt = latestVersion.updatedAt
  }

  return {
    global: latestVersion.version,
    globalExists,
    latestVersionExists,
  }
}
