import type {
  DocumentViewServerProps,
  Locale,
  OptionObject,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
  TypeWithVersion,
} from 'payload'

import { formatDate } from '@payloadcms/ui/shared'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { getLatestVersion, type GetLatestVersionReturnType } from '../Versions/getLatestVersion.js'
import { DefaultVersionView } from './Default/index.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'
import { formatVersionPill } from './SelectComparison/formatVersionPill.js'

export async function VersionView(props: DocumentViewServerProps) {
  const { i18n, initPageResult, routeSegments, searchParams } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    permissions,
    req,
    req: { payload, payload: { config } = {}, user } = {},
  } = initPageResult

  const versionToID = routeSegments[routeSegments.length - 1]

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const localeCodesFromParams = searchParams.localeCodes
    ? JSON.parse(searchParams.localeCodes as string)
    : null

  const versionFromIDFromParams: string = searchParams.versionFrom as string

  const modifiedOnly: boolean = searchParams.modifiedOnly === 'false' ? false : true

  const { localization } = config

  let docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  let slug: string

  let versionTo: TypeWithVersion<any>
  let versionFrom: null | TypeWithVersion<any> = null
  let latestPublishedVersion: GetLatestVersionReturnType = null
  let latestDraftVersion: GetLatestVersionReturnType = null

  if (collectionSlug) {
    // /collections/:slug/:id/versions/:versionID
    slug = collectionSlug
    docPermissions = permissions.collections[collectionSlug]

    try {
      versionTo = await payload.findVersionByID({
        id: versionToID,
        collection: slug,
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (versionFromIDFromParams) {
        versionFrom = await payload.findVersionByID({
          id: versionFromIDFromParams,
          collection: collectionSlug,
          depth: 0,
          locale: 'all',
          overrideAccess: false,
          req,
        })
      } else {
        // By default, we'll compare the previous version. => versionFrom = previous version of versionTo
        versionFrom = (
          await payload.findVersions({
            collection: collectionSlug,
            depth: 0,
            draft: true,
            limit: 1,
            overrideAccess: false,
            req,
            sort: '-updatedAt',
            where: {
              and: [
                {
                  updatedAt: {
                    less_than: versionTo?.updatedAt,
                  },
                },
                {
                  parent: {
                    equals: id,
                  },
                },
              ],
            },
          })
        ).docs[0]
      }

      if (collectionConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'collection',
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          payload,
          req,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'collection',
          locale: 'all',
          overrideAccess: false,
          parentID: id,
          payload,
          req,
          status: 'published',
        })
      }
    } catch (_err) {
      return notFound()
    }
  } else if (globalSlug) {
    // /globals/:slug/versions/:versionID
    slug = globalSlug
    docPermissions = permissions.globals[globalSlug]

    try {
      versionTo = await payload.findGlobalVersionByID({
        id: versionToID,
        slug,
        depth: 0,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (versionFromIDFromParams) {
        versionFrom = await payload.findGlobalVersionByID({
          id: versionFromIDFromParams,
          slug: globalSlug,
          depth: 0,
          locale: 'all',
          overrideAccess: false,
          req,
        })
      } else {
        // By default, we'll compare the previous version. => versionFrom = previous version of versionTo
        versionFrom = (
          await payload.findGlobalVersions({
            slug: globalSlug,
            depth: 0,
            limit: 1,
            overrideAccess: false,
            req,
            sort: '-updatedAt',
            where: {
              and: [
                {
                  updatedAt: {
                    less_than: versionTo?.updatedAt,
                  },
                },
                {
                  parent: {
                    equals: id,
                  },
                },
              ],
            },
          })
        ).docs[0]

        if (!versionFrom) {
          versionFrom = versionTo
        }
      }

      if (globalConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug,
          type: 'global',
          locale: 'all',
          overrideAccess: false,
          payload,
          req,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug,
          type: 'global',
          locale: 'all',
          overrideAccess: false,
          payload,
          req,
          status: 'published',
        })
      }
    } catch (_err) {
      return notFound()
    }
  }

  if (!versionTo) {
    return notFound()
  }

  const publishedNewerThanDraft = latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  if (publishedNewerThanDraft) {
    latestDraftVersion = {
      id: '',
      updatedAt: '',
    }
  }

  let selectedLocales: OptionObject[] = []
  if (localization) {
    let locales: Locale[] = []
    if (localeCodesFromParams) {
      for (const code of localeCodesFromParams) {
        const locale = localization.locales.find((locale) => locale.code === code)
        if (!locale) {
          continue
        }
        locales.push(locale)
      }
    } else {
      locales = localization.locales
    }

    if (localization.filterAvailableLocales) {
      locales = (await localization.filterAvailableLocales({ locales, req })) || []
    }

    selectedLocales = locales.map((locale) => ({
      label: locale.label,
      value: locale.code,
    }))
  }

  const schemaMap = getSchemaMap({
    collectionSlug,
    config,
    globalSlug,
    i18n,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: getClientConfig({ config: payload.config, i18n, importMap: payload.importMap }),
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })
  const RenderedDiff = RenderDiff({
    clientSchemaMap,
    customDiffComponents: {},
    entitySlug: collectionSlug || globalSlug,
    fieldPermissions: docPermissions?.fields,
    fields: (collectionConfig || globalConfig)?.fields,
    i18n,
    modifiedOnly,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    selectedLocales: selectedLocales && selectedLocales.map((locale) => locale.value),
    versionFromSiblingData: versionFrom?.version,
    versionToSiblingData: globalConfig
      ? {
          ...versionTo?.version,
          createdAt: versionTo?.version?.createdAt || versionTo.createdAt,
          updatedAt: versionTo?.version?.updatedAt || versionTo.updatedAt,
        }
      : versionTo?.version,
  })

  const versionToCreatedAt = versionTo?.updatedAt
    ? formatDate({
        date:
          typeof versionTo.updatedAt === 'string'
            ? new Date(versionTo.updatedAt)
            : (versionTo.updatedAt as Date),
        i18n,
        pattern: config.admin.dateFormat,
      })
    : ''

  return (
    <DefaultVersionView
      canUpdate={docPermissions?.update}
      latestDraftVersionID={latestDraftVersion?.id}
      latestPublishedVersionID={latestPublishedVersion?.id}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionFromPill={formatVersionPill({
        doc: versionFrom,
        latestDraftVersionID: latestDraftVersion?.id,
        latestPublishedVersionID: latestPublishedVersion?.id,
      })}
      versionTo={JSON.parse(JSON.stringify(versionTo))}
      versionToCreatedAt={versionToCreatedAt}
      VersionToCreatedAtLabel={
        formatVersionPill({
          doc: versionTo,
          latestDraftVersionID: latestDraftVersion?.id,
          latestPublishedVersionID: latestPublishedVersion?.id,
        }).Label
      }
    />
  )
}
