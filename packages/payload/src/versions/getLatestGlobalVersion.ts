import type { SanitizedGlobalConfig } from '../globals/config/types'
import type { Payload } from '../payload'
import type { Document, PayloadRequest, Where } from '../types'

import { docHasTimestamps } from '../types'

type Args = {
  config: SanitizedGlobalConfig
  locale?: string
  payload: Payload
  req?: PayloadRequest
  slug: string
  where: Where
}

export const getLatestGlobalVersion = async ({
  slug,
  config,
  locale,
  payload,
  req,
  where,
}: Args): Promise<{ global: Document; globalExists: boolean }> => {
  let latestVersion

  const globalConfig = payload.config.globals?.find((cfg) => cfg.slug === slug)

  if (config.versions?.drafts) {
    const findVersionsDbArgs = {
      global: slug,
      limit: 1,
      locale,
      req,
      sort: '-updatedAt',
    }

    if (globalConfig?.db?.findGlobalVersions) {
      latestVersion = (await globalConfig.db.findGlobalVersions(findVersionsDbArgs)).docs[0]
    } else {
      latestVersion = (await payload.db.findGlobalVersions(findVersionsDbArgs)).docs[0]
    }
  }

  const findGlobalArgs = {
    slug,
    locale,
    req,
    where,
  }
  let global
  if (globalConfig?.db?.findGlobal) {
    global = await globalConfig.db.findGlobal(findGlobalArgs)
  } else {
    global = await payload.db.findGlobal(findGlobalArgs)
  }
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
