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
import { VersionPillLabel } from './VersionPillLabel/VersionPillLabel.js'

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

  const [previousVersionResult, versionFromResult, latestPublishedVersion, latestDraftVersion] =
    await Promise.all([
      fetchVersions({
        collectionSlug,
        // If versionFromIDFromParams is provided, the previous version is only used in the version comparison dropdown => depth 0 is enough.
        // If it's not provided, this is used as `versionFrom` in the comparison, which expects populated data => depth 1 is needed.
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
                less_than: versionTo?.updatedAt,
              },
            },
          ],
        },
      }),
      versionFromIDFromParams
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
        : Promise.resolve(null),
      fetchLatestVersion({
        collectionSlug,
        depth: 0,
        globalSlug,
        locale: 'all',
        overrideAccess: false,
        parentID: id,
        req,
        status: 'published',
        user,
      }),
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
    ])

  const previousVersion: null | TypeWithVersion<object> = previousVersionResult?.docs?.[0] ?? null

  const versionFrom: null | TypeWithVersion<object> = versionFromIDFromParams
    ? (versionFromResult as null | TypeWithVersion<object>)
    : // By default, we'll compare the previous version. => versionFrom = version previous to versionTo
      previousVersion

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

  // for SelectComparison: fetch
  // - current (newest) draft (only if no newer published exists): latestDraftVersion
  // - currently published (always); publishedNewerThanDraft ? latestPublishedVersion? : null
  // - previously published (if there is a prior published version older than the one you are lookin at): publishedNewerThanDraft ? null : latestPublishedVersion?
  // - previous version: always, unless doesnt exist. Can be the same as previously published

  const formatPill = ({
    doc,
    labelStyle,
  }: {
    doc: TypeWithVersion<any>
    labelStyle?: 'pill' | 'text'
  }): React.ReactNode => {
    return (
      <VersionPillLabel
        doc={doc}
        key={doc.id}
        labelFirst={true}
        labelStyle={labelStyle ?? 'text'}
        latestDraftVersion={latestDraftVersion}
        latestPublishedVersion={latestPublishedVersion}
      />
    )
  }

  const versionFromOptionsWithDate: ({
    updatedAt: Date
  } & CompareOption)[] = []

  if (previousVersion?.id) {
    versionFromOptionsWithDate.push({
      label: formatPill({ doc: previousVersion }),
      updatedAt: new Date(previousVersion.updatedAt),
      value: previousVersion.id,
    })
  }

  if (versionFrom?.id) {
    versionFromOptionsWithDate.push({
      label: formatPill({ doc: versionFrom }),
      updatedAt: new Date(versionFrom.updatedAt),
      value: versionFrom.id,
    })
  }

  const versionFromOptions: CompareOption[] = versionFromOptionsWithDate
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
      VersionToCreatedAtLabel={formatPill({ doc: versionTo, labelStyle: 'pill' })}
      versionToID={versionTo.id}
      versionToStatus={versionTo?.version?._status}
      versionToUseAsTitle={versionTo?.[collectionConfig.admin?.useAsTitle || 'id']}
    />
  )
}
