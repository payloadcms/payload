import type {
  Locale,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
  SanitizedPermissions,
  TypeWithVersion,
} from 'payload'

import { hasDraftsEnabled } from 'payload/shared'

import { fetchLatestVersion, fetchVersion, fetchVersions } from './fetchVersions.js'

export type VersionViewData = {
  currentlyPublishedVersion: null | TypeWithVersion<object>
  docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  latestDraftVersion: null | TypeWithVersion<object>
  previousPublishedVersion: null | TypeWithVersion<object>
  previousVersion: null | TypeWithVersion<object>
  selectedLocales: string[]
  versionFrom: null | TypeWithVersion<object>
  versionTo: TypeWithVersion<{ _status?: string }>
}

export async function getVersionViewData({
  id,
  collectionConfig,
  globalConfig,
  hasPublishedDoc,
  localeCodesFromParams,
  permissions,
  req,
  versionFromIDFromParams,
  versionToID,
}: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasPublishedDoc: boolean
  id?: number | string
  localeCodesFromParams?: string[]
  permissions: SanitizedPermissions
  req: PayloadRequest
  versionFromIDFromParams?: string
  versionToID: string
}): Promise<VersionViewData> {
  const {
    payload: {
      config: { localization },
    },
    user,
  } = req

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

  const docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission = collectionSlug
    ? permissions.collections[collectionSlug]
    : permissions.globals[globalSlug]

  const versionTo = await fetchVersion<{ _status?: string }>({
    id: versionToID,
    collectionSlug,
    depth: 1,
    globalSlug,
    locale: 'all',
    overrideAccess: false,
    req,
    user,
  })

  if (!versionTo) {
    throw new Error('not-found')
  }

  const [
    previousVersionResult,
    versionFromResult,
    currentlyPublishedVersion,
    latestDraftVersion,
    previousPublishedVersionResult,
  ] = await Promise.all([
    fetchVersions({
      collectionSlug,
      depth: versionFromIDFromParams ? 0 : 1,
      draft: true,
      globalSlug,
      limit: 1,
      locale: 'all',
      overrideAccess: false,
      parentID: id,
      req,
      sort: '-updatedAt',
      user,
      where: {
        and: [
          {
            updatedAt: {
              less_than: versionTo.updatedAt,
            },
          },
        ],
      },
    }),
    (versionFromIDFromParams
      ? fetchVersion({
          id: versionFromIDFromParams,
          collectionSlug,
          depth: 1,
          globalSlug,
          locale: 'all',
          overrideAccess: false,
          req,
          user,
        })
      : Promise.resolve(null)) as Promise<null | TypeWithVersion<object>>,
    hasPublishedDoc
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          locale: req.locale,
          overrideAccess: false,
          parentID: id,
          req,
          status: 'published',
          user,
        })
      : Promise.resolve(null),
    draftsEnabled
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          req,
          status: 'draft',
          user,
        })
      : Promise.resolve(null),
    draftsEnabled
      ? fetchVersions({
          collectionSlug,
          depth: 0,
          draft: true,
          globalSlug,
          limit: 1,
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          req,
          sort: '-updatedAt',
          user,
          where: {
            and: [
              {
                updatedAt: {
                  less_than: versionTo.updatedAt,
                },
              },
              {
                'version._status': {
                  equals: 'published',
                },
              },
            ],
          },
        })
      : Promise.resolve(null),
  ])

  const previousVersion: null | TypeWithVersion<object> = previousVersionResult?.docs?.[0] ?? null
  const versionFrom = versionFromResult || previousVersion
  const previousPublishedVersion = previousPublishedVersionResult?.docs?.[0] ?? null

  let selectedLocales: string[] = []

  if (localization) {
    let locales: Locale[] = []

    if (localeCodesFromParams) {
      for (const code of localeCodesFromParams) {
        const locale = localization.locales.find((l) => l.code === code)

        if (locale) {
          locales.push(locale)
        }
      }
    } else {
      locales = localization.locales
    }

    if (localization.filterAvailableLocales) {
      locales = (await localization.filterAvailableLocales({ locales, req })) || []
    }

    selectedLocales = locales.map((l) => l.code)
  }

  return {
    currentlyPublishedVersion,
    docPermissions,
    latestDraftVersion,
    previousPublishedVersion,
    previousVersion,
    selectedLocales,
    versionFrom,
    versionTo,
  }
}
