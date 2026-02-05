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
import { hasDraftsEnabled } from 'payload/shared'
import React from 'react'

import type { CompareOption } from './Default/types.js'

import { DefaultVersionView } from './Default/index.js'
import { fetchLatestVersion, fetchVersion, fetchVersions } from './fetchVersions.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'
import { getVersionLabel } from './VersionPillLabel/getVersionLabel.js'
import { VersionPillLabel } from './VersionPillLabel/VersionPillLabel.js'

export async function VersionView(props: DocumentViewServerProps) {
  const { hasPublishedDoc, i18n, initPageResult, routeSegments, searchParams } = props

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

  const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

  // Resolve user's current locale for version label comparison (not 'all')
  const userLocale =
    (searchParams.locale as string) ||
    (req.locale !== 'all' ? req.locale : localization && localization.defaultLocale)

  const localeCodesFromParams = searchParams.localeCodes
    ? JSON.parse(searchParams.localeCodes as string)
    : null

  const versionFromIDFromParams = searchParams.versionFrom as string

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

  const [
    previousVersionResult,
    versionFromResult,
    currentlyPublishedVersion,
    latestDraftVersion,
    previousPublishedVersionResult,
  ] = await Promise.all([
    // Previous version (the one before the versionTo)
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
              less_than: versionTo.updatedAt,
            },
          },
        ],
      },
    }),
    // Version from ID from params
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
    // Currently published version - do note: currently published != latest published, as an unpublished version can be the latest published
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
    // Latest draft version
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
    // Previous published version
    // Only query for published versions if drafts are enabled (since _status field only exists with drafts)
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

  const versionFrom =
    versionFromResult ||
    // By default, we'll compare the previous version. => versionFrom = version previous to versionTo
    previousVersion

  // Previous published version before the versionTo
  const previousPublishedVersion = previousPublishedVersionResult?.docs?.[0] ?? null

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
    config: getClientConfig({
      config: payload.config,
      i18n,
      importMap: payload.importMap,
      user,
    }),
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })
  const RenderedDiff = RenderDiff({
    clientSchemaMap,
    customDiffComponents: {},
    entitySlug: collectionSlug || globalSlug,
    fields: (collectionConfig || globalConfig)?.fields,
    fieldsPermissions: docPermissions?.fields,
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
      ...versionTo.version,
      updatedAt: versionTo.updatedAt,
    },
  })

  const versionToCreatedAtFormatted = versionTo.updatedAt
    ? formatDate({
        date:
          typeof versionTo.updatedAt === 'string'
            ? new Date(versionTo.updatedAt)
            : (versionTo.updatedAt as Date),
        i18n,
        pattern: config.admin.dateFormat,
      })
    : ''

  const formatPill = ({
    doc,
    labelOverride,
    labelStyle,
    labelSuffix,
  }: {
    doc: TypeWithVersion<any>
    labelOverride?: string
    labelStyle?: 'pill' | 'text'
    labelSuffix?: React.ReactNode
  }): React.ReactNode => {
    return (
      <VersionPillLabel
        currentlyPublishedVersion={currentlyPublishedVersion}
        doc={doc}
        key={doc.id}
        labelFirst={true}
        labelOverride={labelOverride}
        labelStyle={labelStyle ?? 'text'}
        labelSuffix={labelSuffix}
        latestDraftVersion={latestDraftVersion}
      />
    )
  }

  // SelectComparison Options:
  //
  // Previous version: always, unless doesn't exist. Can be the same as previously published
  // Latest draft: only if no newer published exists (latestDraftVersion)
  // Currently published: always, if exists
  // Previously published: if there is a prior published version older than versionTo
  // Specific Version: only if not already present under other label (= versionFrom)

  let versionFromOptions: {
    doc: TypeWithVersion<any>
    labelOverride?: string
    updatedAt: Date
    value: string
  }[] = []

  // Previous version
  if (previousVersion?.id) {
    versionFromOptions.push({
      doc: previousVersion,
      labelOverride: i18n.t('version:previousVersion'),
      updatedAt: new Date(previousVersion.updatedAt),
      value: previousVersion.id,
    })
  }

  // Latest Draft
  const publishedNewerThanDraft =
    currentlyPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt
  if (latestDraftVersion && !publishedNewerThanDraft) {
    versionFromOptions.push({
      doc: latestDraftVersion,
      updatedAt: new Date(latestDraftVersion.updatedAt),
      value: latestDraftVersion.id,
    })
  }

  // Currently Published
  if (currentlyPublishedVersion) {
    versionFromOptions.push({
      doc: currentlyPublishedVersion,
      updatedAt: new Date(currentlyPublishedVersion.updatedAt),
      value: currentlyPublishedVersion.id,
    })
  }

  // Previous Published
  if (previousPublishedVersion && currentlyPublishedVersion?.id !== previousPublishedVersion.id) {
    versionFromOptions.push({
      doc: previousPublishedVersion,
      labelOverride: i18n.t('version:previouslyPublished'),
      updatedAt: new Date(previousPublishedVersion.updatedAt),
      value: previousPublishedVersion.id,
    })
  }

  // Specific Version
  if (versionFrom?.id && !versionFromOptions.some((option) => option.value === versionFrom.id)) {
    // Only add "specific version" if it is not already in the options
    versionFromOptions.push({
      doc: versionFrom,
      labelOverride: i18n.t('version:specificVersion'),
      updatedAt: new Date(versionFrom.updatedAt),
      value: versionFrom.id,
    })
  }

  versionFromOptions = versionFromOptions.sort((a, b) => {
    // Sort by updatedAt, newest first
    if (a && b) {
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    }
    return 0
  })

  const versionToIsVersionFrom = versionFrom?.id === versionTo.id

  const versionFromComparisonOptions: CompareOption[] = []

  for (const option of versionFromOptions) {
    const isVersionTo = option.value === versionTo.id

    if (isVersionTo && !versionToIsVersionFrom) {
      // Don't offer selecting a versionFrom that is the same as versionTo, unless it's already selected
      continue
    }

    const alreadyAdded = versionFromComparisonOptions.some(
      (existingOption) => existingOption.value === option.value,
    )
    if (alreadyAdded) {
      continue
    }

    const otherOptionsWithSameID = versionFromOptions.filter(
      (existingOption) => existingOption.value === option.value && existingOption !== option,
    )

    // Merge options with same ID to the same option
    const labelSuffix = otherOptionsWithSameID?.length ? (
      <span key={`${option.value}-suffix`}>
        {' ('}
        {otherOptionsWithSameID.map((optionWithSameID, index) => {
          const label =
            optionWithSameID.labelOverride ||
            getVersionLabel({
              currentLocale: userLocale,
              currentlyPublishedVersion,
              latestDraftVersion,
              t: i18n.t,
              version: optionWithSameID.doc,
            }).label

          return (
            <React.Fragment key={`${optionWithSameID.value}-${index}`}>
              {index > 0 ? ', ' : ''}
              {label}
            </React.Fragment>
          )
        })}
        {')'}
      </span>
    ) : undefined

    versionFromComparisonOptions.push({
      label: formatPill({
        doc: option.doc,
        labelOverride: option.labelOverride,
        labelSuffix,
      }),
      value: option.value,
    })
  }

  return (
    <DefaultVersionView
      canUpdate={docPermissions?.update}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionFromCreatedAt={versionFrom?.createdAt}
      versionFromID={versionFrom?.id}
      versionFromOptions={versionFromComparisonOptions}
      versionToCreatedAt={versionTo.createdAt}
      versionToCreatedAtFormatted={versionToCreatedAtFormatted}
      VersionToCreatedAtLabel={formatPill({ doc: versionTo, labelStyle: 'pill' })}
      versionToID={versionTo.id}
      versionToStatus={versionTo.version?._status}
    />
  )
}
