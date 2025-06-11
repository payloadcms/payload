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

import { DefaultVersionView } from './Default/index.js'
import { fetchLatestVersion, fetchVersion, fetchVersions } from './fetchVersions.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'
import { formatVersionPill } from './VersionPillLabel/formatVersionPill.js'

export async function VersionView(props: DocumentViewServerProps) {
  const { i18n, initPageResult, routeSegments, searchParams } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    permissions,
    req,
    req: { payload, payload: { config, config: { localization } } = {}, user } = {},
  } = initPageResult

  const versionToID = routeSegments[routeSegments.length - 1]

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const draftsEnabled = (collectionConfig ?? globalConfig)?.versions?.drafts

  const localeCodesFromParams = searchParams.localeCodes
    ? JSON.parse(searchParams.localeCodes as string)
    : null

  const versionFromIDFromParams: string = searchParams.versionFrom as string

  const modifiedOnly: boolean = searchParams.modifiedOnly === 'false' ? false : true

  const docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission = collectionSlug
    ? permissions.collections[collectionSlug]
    : permissions.globals[globalSlug]

  const versionTo = await fetchVersion<{
    _status?: string
  }>({
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
    return notFound()
  }

  const previousVersion: null | TypeWithVersion<object> = (
    await fetchVersions({
      collectionSlug,
      depth: 1,
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
              less_than: versionTo?.updatedAt,
            },
          },
        ],
      },
    })
  )?.[0]

  const versionFrom: null | TypeWithVersion<object> = versionFromIDFromParams
    ? await fetchVersion({
        id: versionFromIDFromParams,
        collectionSlug,
        depth: 1,
        globalSlug,
        locale: 'all',
        overrideAccess: false,
        req,
        user,
      })
    : // By default, we'll compare the previous version. => versionFrom = version previous to versionTo
      previousVersion

  const latestPublishedVersion = await fetchLatestVersion({
    collectionSlug,
    depth: 0,
    globalSlug,
    locale: 'all',
    overrideAccess: false,
    parentID: id,
    req,
    status: 'published',
    user,
  })
  const latestDraftVersion = draftsEnabled
    ? await fetchLatestVersion({
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
    : null

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
  // - current (newest) draft (only if no newer published exists): latestDraftVersion
  // - currently published (always); publishedNewerThanDraft ? latestPublishedVersion? : null
  // - previously published (if there is a prior published version older than the one you are lookin at): publishedNewerThanDraft ? null : latestPublishedVersion?
  // - previous version: always, unless doesnt exist. Can be the same as previously published

  const currentlyPublishedVersion = publishedNewerThanDraft ? latestPublishedVersion : null
  let previouslyPublishedVersion = publishedNewerThanDraft ? null : latestPublishedVersion

  if (currentlyPublishedVersion && publishedNewerThanDraft) {
    // There may be a previously published version we can fetch

    previouslyPublishedVersion = await fetchLatestVersion({
      collectionSlug,
      depth: 0,
      globalSlug,
      locale: 'all',
      overrideAccess: false,
      parentID: id,
      req,
      status: 'published',
      user,
      where: {
        and: [
          {
            updatedAt: {
              less_than: currentlyPublishedVersion.updatedAt,
            },
          },
        ],
      },
    })
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

  return (
    <DefaultVersionView
      canUpdate={docPermissions?.update}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionFromCreatedAt={versionFrom?.createdAt}
      versionFromID={versionFrom?.id}
      versionFromOptions={versionFromOptions}
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
