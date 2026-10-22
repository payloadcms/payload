import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Document, Payload, PayloadRequest, Where } from '../types/index.js'
import type { BranchWriteObservation } from './branches/writes/prepareBranchWrite.js'
import type { TypeWithVersion } from './types.js'

import { hasWhereAccessResult } from '../auth/types.js'
import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { resolveBranchOriginal } from './branches/operations/resolveBranchOriginal.js'
import { legacyVersionWhere } from './branches/storage/legacyVersionWhere.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'

type Args = {
  branchWrite?: BranchWriteObservation | null
  config: SanitizedGlobalConfig
  locale?: string
  overrideAccess?: boolean
  payload: Payload
  published?: boolean
  req?: PayloadRequest
  slug: string
  where: Where
}

export const getLatestGlobalVersion = async ({
  slug,
  branchWrite,
  config,
  locale,
  overrideAccess,
  payload,
  published,
  req,
  where,
}: Args): Promise<{ global: Document; globalExists: boolean }> => {
  if (branchWrite) {
    const effective = await resolveBranchOriginal({
      global: slug,
      observation: branchWrite,
      overrideAccess,
      req: req!,
      where,
    })
    const existing = await payload.db.findGlobal({ slug, locale, req })
    return {
      global: effective as Document,
      globalExists: Boolean(existing && Object.keys(existing).length > 0),
    }
  }

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
        where: legacyVersionWhere({
          entity: config,
          where: combineQueries(appendVersionToQueryKey(where), whereQuery as unknown as Where),
        }),
      })
    ).docs[0]
  }

  const global = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where,
  })
  const existingGlobal = hasWhereAccessResult(where)
    ? await payload.db.findGlobal({
        slug,
        locale,
        req,
      })
    : global
  const globalExists = Boolean(existingGlobal && Object.keys(existingGlobal).length > 0)

  if (!latestVersion) {
    return {
      global,
      globalExists,
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
  }
}
