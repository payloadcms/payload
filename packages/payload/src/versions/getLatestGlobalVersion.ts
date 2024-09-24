import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Document, Payload, PayloadRequest, Where } from '../types/index.js'

import { docHasTimestamps } from '../types/index.js'

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
  slug,
  config,
  locale,
  payload,
  published,
  req,
  where,
}: Args): Promise<{ global: Document; globalExists: boolean }> => {
  let latestVersion

  const globalConfig = payload.config.globals?.find((cfg) => cfg.slug === slug)

  const whereQuery = published
    ? { 'version._status': { equals: 'published' } }
    : { latest: { equals: true } }

  if (config.versions?.drafts) {
    const findVersionsDbArgs = {
      global: slug,
      limit: 1,
      locale,
      pagination: false,
      req,
      where: whereQuery,
    }

    // @ts-expect-error exists
    if (globalConfig?.db?.findGlobalVersions) {
      // @ts-expect-error exists
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
  // @ts-expect-error exists
  if (globalConfig?.db?.findGlobal) {
    // @ts-expect-error exists
    global = await globalConfig.db.findGlobal(findGlobalArgs)
  } else {
    global = await payload.db.findGlobal(findGlobalArgs)
  }

  const globalExists = Boolean(global)

  if (!latestVersion) {
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
