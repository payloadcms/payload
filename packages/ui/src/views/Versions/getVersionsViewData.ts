import type {
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithVersion,
  Where,
} from 'payload'

import { formatAdminURL, hasDraftsEnabled, isNumber } from 'payload/shared'

import { fetchLatestVersion, fetchVersions } from '../Version/fetchVersions.js'

export type VersionsViewData = {
  currentlyPublishedVersion: null | TypeWithVersion<object>
  fetchURL: string
  latestDraftVersion: null | TypeWithVersion<object>
  versionsData: PaginatedDocs
}

export async function getVersionsViewData({
  id,
  collectionConfig,
  globalConfig,
  hasPublishedDoc,
  limit,
  page,
  req,
  sort,
}: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasPublishedDoc: boolean
  id?: number | string
  limit?: number | string
  page?: number | string
  req: PayloadRequest
  sort?: string
}): Promise<VersionsViewData> {
  const {
    payload: {
      config,
      config: {
        localization,
        routes: { api: apiRoute },
      },
    },
    user,
  } = req

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

  const whereQuery: { and: Array<Record<string, unknown>> } & Where = { and: [] }

  if (localization && draftsEnabled) {
    whereQuery.and.push({
      snapshot: {
        not_equals: true,
      },
    })
  }

  const defaultLimit = collectionSlug ? collectionConfig?.admin?.pagination?.defaultLimit : 10
  const limitToUse = isNumber(limit) ? Number(limit) : defaultLimit

  const versionsData: PaginatedDocs = await fetchVersions({
    collectionSlug,
    depth: 0,
    globalSlug,
    limit: limitToUse,
    locale: req.locale,
    overrideAccess: false,
    page: page ? parseInt(page.toString(), 10) : undefined,
    parentID: id,
    req,
    sort,
    user,
    where: whereQuery,
  })

  if (!versionsData) {
    throw new Error('not-found')
  }

  const [currentlyPublishedVersion, latestDraftVersion] = await Promise.all([
    hasPublishedDoc
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          locale: req.locale,
          overrideAccess: false,
          parentID: id,
          req,
          select: {
            id: true,
            updatedAt: true,
            version: {
              _status: true,
              updatedAt: true,
            },
          },
          status: 'published',
          user,
          where: localization
            ? {
                snapshot: {
                  not_equals: true,
                },
              }
            : undefined,
        })
      : Promise.resolve(null),
    draftsEnabled
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          locale: req.locale,
          overrideAccess: false,
          parentID: id,
          req,
          select: {
            id: true,
            updatedAt: true,
            version: {
              _status: true,
              updatedAt: true,
            },
          },
          status: 'draft',
          user,
          where: localization
            ? {
                snapshot: {
                  not_equals: true,
                },
              }
            : undefined,
        })
      : Promise.resolve(null),
  ])

  const fetchURL = formatAdminURL({
    apiRoute,
    path: collectionSlug ? `/${collectionSlug}/versions` : `/${globalSlug}/versions`,
  })

  return {
    currentlyPublishedVersion,
    fetchURL,
    latestDraftVersion,
    versionsData,
  }
}
