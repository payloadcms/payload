import type {
  DocumentViewServerProps,
  Locale,
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

import type { CompareOption } from './Default/types.js'

import { getLatestVersion, type GetLatestVersionReturnType } from '../Versions/getLatestVersion.js'
import { VersionsView } from '../Versions/index.js'
import { DefaultVersionView } from './Default/index.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'
import { CreatedAtCell } from './SelectComparison/VersionDrawer/CreatedAtCell.js'
import { formatVersionPill } from './VersionPillLabel/formatVersionPill.js'

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
        depth: 1,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (versionFromIDFromParams) {
        versionFrom = await payload.findVersionByID({
          id: versionFromIDFromParams,
          collection: collectionSlug,
          depth: 1,
          locale: 'all',
          overrideAccess: false,
          req,
        })
      } else {
        // By default, we'll compare the previous version. => versionFrom = previous version of versionTo
        versionFrom = (
          await payload.findVersions({
            collection: collectionSlug,
            depth: 1,
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
        depth: 1,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })

      if (versionFromIDFromParams) {
        versionFrom = await payload.findGlobalVersionByID({
          id: versionFromIDFromParams,
          slug: globalSlug,
          depth: 1,
          locale: 'all',
          overrideAccess: false,
          req,
        })
      } else {
        // By default, we'll compare the previous version. => versionFrom = previous version of versionTo
        versionFrom = (
          await payload.findGlobalVersions({
            slug: globalSlug,
            depth: 1,
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

  let selectedLocales: string[] = []
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

    selectedLocales = locales.map((locale) => locale.code)
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
    selectedLocales,
    versionFromSiblingData: {
      ...versionFrom?.version,
      updatedAt: versionFrom?.updatedAt,
    },
    versionToSiblingData: {
      ...versionTo?.version,
      updatedAt: versionTo?.updatedAt,
    },
  })

  const versionToCreatedAtFormatted = versionTo?.updatedAt
    ? formatDate({
        date:
          typeof versionTo.updatedAt === 'string'
            ? new Date(versionTo.updatedAt)
            : (versionTo.updatedAt as Date),
        i18n,
        pattern: config.admin.dateFormat,
      })
    : ''

  const publishedNewerThanDraft = latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  // for SelectComparison: fetch
  // - current (newest) draft: latestDraftVersion
  // - currently published; publishedNewerThanDraft ? latestPublishedVersion? : null
  // - previously published: publishedNewerThanDraft ? null : latestPublishedVersion?

  const currentlyPublishedVersion = publishedNewerThanDraft ? latestPublishedVersion : null
  let previouslyPublishedVersion = publishedNewerThanDraft ? null : latestPublishedVersion

  if (currentlyPublishedVersion && publishedNewerThanDraft) {
    // There may be a previously published version we can fetch
    if (collectionSlug) {
      previouslyPublishedVersion = await getLatestVersion({
        slug,
        type: 'collection',
        additionalWheres: [
          {
            updatedAt: {
              less_than: currentlyPublishedVersion.updatedAt,
            },
          },
        ],
        locale: 'all',
        overrideAccess: false,
        parentID: id,
        payload,
        req,
        status: 'published',
      })
    } else if (globalSlug) {
      previouslyPublishedVersion = await getLatestVersion({
        slug,
        type: 'global',
        additionalWheres: [
          {
            updatedAt: {
              less_than: currentlyPublishedVersion.updatedAt,
            },
          },
        ],
        locale: 'all',
        overrideAccess: false,
        payload,
        req,
        status: 'published',
      })
    }
  }

  const currentlyPublishedVersionPill = currentlyPublishedVersion
    ? formatVersionPill({
        doc: currentlyPublishedVersion,
        hasPublishedDoc: !!latestPublishedVersion,
        labelFirst: true,
        labelStyle: 'text',
        latestDraftVersionID: latestDraftVersion?.id,
        latestPublishedVersionID: latestPublishedVersion?.id,
      })
    : null

  const latestDraftVersionPill = latestDraftVersion
    ? formatVersionPill({
        doc: latestDraftVersion,
        hasPublishedDoc: !!latestPublishedVersion,
        labelFirst: true,
        labelStyle: 'text',
        latestDraftVersionID: latestDraftVersion?.id,
        latestPublishedVersionID: latestPublishedVersion?.id,
      })
    : null

  const previouslyPublishedVersionPill = previouslyPublishedVersion
    ? formatVersionPill({
        doc: previouslyPublishedVersion,
        hasPublishedDoc: !!latestPublishedVersion,
        labelFirst: true,
        labelStyle: 'text',
        latestDraftVersionID: latestDraftVersion?.id,
        latestPublishedVersionID: latestPublishedVersion?.id,
      })
    : null

  const versionFromPill = versionFrom
    ? formatVersionPill({
        doc: versionFrom,
        hasPublishedDoc: !!latestPublishedVersion,
        labelFirst: true,
        labelStyle: 'text',
        latestDraftVersionID: latestDraftVersion?.id,

        latestPublishedVersionID: latestPublishedVersion?.id,
      })
    : null

  const versionFromOptions = [
    currentlyPublishedVersionPill
      ? {
          label: currentlyPublishedVersionPill.Label,
          updatedAt: new Date(currentlyPublishedVersion.updatedAt),
          value: currentlyPublishedVersionPill.id || '',
        }
      : null,
    latestDraftVersionPill
      ? {
          label: latestDraftVersionPill.Label,
          updatedAt: new Date(latestDraftVersion.updatedAt),
          value: latestDraftVersionPill.id || '',
        }
      : null,
    previouslyPublishedVersionPill
      ? {
          label: previouslyPublishedVersionPill.Label,
          updatedAt: new Date(previouslyPublishedVersion.updatedAt),
          value: previouslyPublishedVersionPill.id || '',
        }
      : null,
    versionFromPill
      ? {
          label: versionFromPill.Label,
          updatedAt: new Date(versionFrom.updatedAt),
          value: versionFromPill.id || '',
        }
      : null,
    // Remove entries with duplicative values, sort by updatedAt, descending, then remove updatedAt from the options
  ]
    .filter(Boolean)
    .reduce((acc: ({ updatedAt: Date } & CompareOption)[], option) => {
      if (option && !acc.some((existingOption) => existingOption.value === option.value)) {
        acc.push(option)
      }
      return acc
    }, [])
    .sort((a, b) => {
      if (a && b) {
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      }
      return 0
    })
    .map((option) => {
      if (option) {
        const { updatedAt, ...rest } = option
        return rest
      }
      return option
    }) as CompareOption[]

  const _VersionsView = (
    <VersionsView {...props} CreatedAtCellOverride={CreatedAtCell} disableGutter={true} />
  )

  return (
    <DefaultVersionView
      canUpdate={docPermissions?.update}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionFromCreatedAt={versionFrom?.createdAt}
      versionFromID={versionFrom?.id}
      versionFromOptions={versionFromOptions}
      VersionsView={_VersionsView}
      versionToCreatedAt={versionTo?.createdAt}
      versionToCreatedAtFormatted={versionToCreatedAtFormatted}
      VersionToCreatedAtLabel={
        formatVersionPill({
          doc: versionTo,
          hasPublishedDoc: !!latestPublishedVersion,
          labelFirst: true,
          latestDraftVersionID: latestDraftVersion?.id,
          latestPublishedVersionID: latestPublishedVersion?.id,
        }).Label
      }
      versionToID={versionTo.id}
      versionToStatus={versionTo?.version?._status}
      versionToUseAsTitle={versionTo?.[collectionConfig.admin?.useAsTitle || 'id']}
    />
  )
}
