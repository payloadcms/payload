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
  where: Where
}

type Result = {
  global: Document
  globalExists: boolean
  hasMainDocument: boolean
}

export const getLatestGlobalVersion = async ({
  slug,
  config,
  locale,
  payload,
  published,
  req,
  where,
}: Args): Promise<Result> => {
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
        where: whereQuery as unknown as Where,
      })
    ).docs[0]
  }

  const mainDocument = await payload.db.findGlobal({
    slug,
    locale,
    req,
  })
  const hasMainDocument = Boolean(mainDocument && Object.keys(mainDocument).length > 0)
  const globalExists = Boolean(latestVersion) || hasMainDocument

  if (latestVersion) {
    let accessibleLatestVersion: TypeWithVersion<Document> | undefined = latestVersion

    if (hasWhereAccessResult(where)) {
      const versionAccessQuery = combineQueries(appendGlobalVersionToQueryKey(where), {
        id: { equals: latestVersion.id },
      })

      accessibleLatestVersion = (
        await payload.db.findGlobalVersions({
          global: slug,
          limit: 1,
          locale: locale || req?.locale || undefined,
          pagination: false,
          req,
          where: versionAccessQuery,
        })
      ).docs[0]
    }

    if (!accessibleLatestVersion) {
      return {
        global: {},
        globalExists,
        hasMainDocument,
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
      hasMainDocument,
    }
  }

  if (!hasWhereAccessResult(where) || !hasMainDocument) {
    return {
      global: mainDocument,
      globalExists,
      hasMainDocument,
    }
  }

  const accessibleMainDocument = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where,
  })

  return {
    global: accessibleMainDocument,
    globalExists,
    hasMainDocument,
  }
}
