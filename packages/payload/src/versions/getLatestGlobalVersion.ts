import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Document, Payload, PayloadRequest, Where } from '../types/index.js'
import type { DocumentVersion } from '../types/operations.js'
import type { TypeWithVersion } from './types.js'

import { hasWhereAccessResult } from '../auth/types.js'
import { combineQueries } from '../database/combineQueries.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'
import { getVersionStatusQuery } from './getVersionStatusQuery.js'
import { resolveVersionDocument } from './resolveVersionDocument.js'

type Args = {
  config: SanitizedGlobalConfig
  locale?: string
  payload: Payload
  published?: boolean
  req?: PayloadRequest
  slug: string
  version?: DocumentVersion
  where: Where
}

export const getLatestGlobalVersion = async ({
  slug,
  config,
  locale,
  payload,
  published,
  req,
  version,
  where,
}: Args): Promise<{
  global: Document
  globalExists: boolean
  hasMainDocument: boolean
  selectedIsDraft: boolean
}> => {
  let latestVersion: TypeWithVersion<Document> | undefined

  const shouldReadPublished = published || version === 'published'
  const whereQuery: Where = {
    and: [
      { latest: { equals: true } },
      appendVersionToQueryKey(
        getVersionStatusQuery({
          entity: config,
          locale: version === 'draft' ? 'all' : locale || req?.locale,
          localization: payload.config.localization,
          status: 'draft',
        }),
      ),
    ],
  }

  if (hasDraftsEnabled(config) && !shouldReadPublished) {
    latestVersion = (
      await payload.db.findGlobalVersions({
        global: slug,
        limit: 1,
        locale: locale || req?.locale || undefined,
        pagination: false,
        req,
        where: combineQueries(appendVersionToQueryKey(where), whereQuery as unknown as Where),
      })
    ).docs[0]
  }

  const global = await payload.db.findGlobal({
    slug,
    locale,
    req,
    where:
      shouldReadPublished && hasDraftsEnabled(config)
        ? combineQueries(
            where,
            getVersionStatusQuery({
              entity: config,
              locale: locale || req?.locale,
              localization: payload.config.localization,
              status: 'published',
            }),
          )
        : where,
  })
  const existingGlobal =
    hasWhereAccessResult(where) || (shouldReadPublished && hasDraftsEnabled(config))
      ? await payload.db.findGlobal({
          slug,
          locale,
          req,
        })
      : global
  const hasMainDocument = Boolean(existingGlobal && Object.keys(existingGlobal).length > 0)
  let globalExists = hasMainDocument

  if (!globalExists && hasDraftsEnabled(config)) {
    // Initial global drafts exist only in versions. Access constraints must not turn an existing
    // draft into a new global, which would bypass the failed update constraint.
    globalExists =
      Boolean(latestVersion) ||
      (
        await payload.db.findGlobalVersions({
          global: slug,
          limit: 1,
          pagination: false,
          req,
          where: { latest: { equals: true } },
        })
      ).docs.length > 0
  }

  if (!latestVersion && !shouldReadPublished && hasDraftsEnabled(config)) {
    const activeDraft = await payload.db.findGlobalVersions({
      global: slug,
      limit: 1,
      pagination: false,
      req,
      where: whereQuery,
    })

    if (activeDraft.docs.length > 0) {
      return { global: {} as Document, globalExists: true, hasMainDocument, selectedIsDraft: true }
    }
  }

  if (!latestVersion) {
    return {
      global,
      globalExists,
      hasMainDocument,
      selectedIsDraft: false,
    }
  }

  if (!latestVersion.version.createdAt) {
    latestVersion.version.createdAt = latestVersion.createdAt
  }

  if (!latestVersion.version.updatedAt) {
    latestVersion.version.updatedAt = latestVersion.updatedAt
  }

  return {
    global:
      req && version !== 'draft'
        ? resolveVersionDocument({
            doc: latestVersion.version,
            entity: config,
            publishedDoc: global,
            req,
            version: 'latest',
          })
        : latestVersion.version,
    globalExists,
    hasMainDocument,
    selectedIsDraft: true,
  }
}
