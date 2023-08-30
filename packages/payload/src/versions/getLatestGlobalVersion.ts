import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload } from '../payload.js'
import type { Document, PayloadRequest, Where } from '../types/index.js'

import { docHasTimestamps } from '../types/index.js'

type Args = {
  config: SanitizedGlobalConfig
  locale?: string
  payload: Payload
  req?: PayloadRequest
  slug: string
  where: Where
}

export const getLatestGlobalVersion = async ({
  config,
  locale,
  payload,
  req,
  slug,
  where,
}: Args): Promise<{ global: Document; globalExists: boolean }> => {
  let latestVersion

  if (config.versions?.drafts) {
    // eslint-disable-next-line prefer-destructuring
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale,
        req,
        sort: '-updatedAt',
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
