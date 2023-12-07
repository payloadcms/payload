import type { SanitizedGlobalConfig } from '../globals/config/types'
import type { Payload } from '../payload'
import type { Document, PayloadRequest, Where } from '../types'

import { docHasTimestamps } from '../types'

type Args = {
  config: SanitizedGlobalConfig
  locale?: string
  payload: Payload
  published?: boolean
  req?: PayloadRequest
  slug: string
  where: Where
}

export const getLatestGlobalVersion = async ({
  config,
  locale,
  payload,
  published,
  req,
  slug,
  where,
}: Args): Promise<{ global: Document; globalExists: boolean }> => {
  let latestVersion

  const whereQuery = published ? { 'version._status': { equals: 'published' } } : {}

  if (config.versions?.drafts) {
    // eslint-disable-next-line prefer-destructuring
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale,
        req,
        sort: '-updatedAt',
        where: whereQuery,
      })
    ).docs[0]
  }

  const global = await payload.db.findGlobal({
    locale,
    req,
    slug,
    where,
  })
  const globalExists = Boolean(global)

  if (!latestVersion || (docHasTimestamps(global) && latestVersion.updatedAt < global.updatedAt)) {
    return {
      global,
      globalExists,
    }
  }

  return {
    global: {
      ...latestVersion.version,
      createdAt: latestVersion.createdAt,
      updatedAt: latestVersion.updatedAt,
    },
    globalExists,
  }
}
