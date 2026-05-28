import type { DocumentViewServerProps, TypeWithVersion } from 'payload'

import React from 'react'

import type { CompareOption } from './Default/types.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getClientSchemaMap } from '../../utilities/getClientSchemaMap.js'
import { getSchemaMap } from '../../utilities/getSchemaMap.js'
import { DefaultVersionView } from './Default/index.js'
import { getVersionViewData } from './getVersionViewData.js'
import { RenderDiff } from './RenderFieldsToDiff/index.js'
import { getVersionLabel } from './VersionPillLabel/getVersionLabel.js'
import { VersionPillLabel } from './VersionPillLabel/VersionPillLabel.js'

/**
 * Framework-agnostic Version (single version comparison) view RSC.
 *
 * Resolves the requested version + comparison version, builds the diff
 * descriptor, and renders the presentational `DefaultVersionView`.
 *
 * Throws `Error('not-found')` when the version cannot be resolved; the
 * adapter translates to its native 404.
 */
export const VersionViewRSC = async (props: DocumentViewServerProps) => {
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

  const userLocale =
    (searchParams.locale as string) ||
    (req.locale !== 'all' ? req.locale : localization && localization.defaultLocale)

  const localeCodesFromParams = searchParams.localeCodes
    ? JSON.parse(searchParams.localeCodes as string)
    : null

  const versionFromIDFromParams = searchParams.versionFrom as string
  const modifiedOnly: boolean = searchParams.modifiedOnly === 'false' ? false : true

  const versionData = await getVersionViewData({
    id,
    collectionConfig,
    globalConfig,
    hasPublishedDoc,
    localeCodesFromParams,
    permissions,
    req,
    versionFromIDFromParams,
    versionToID,
  })

  const {
    currentlyPublishedVersion,
    docPermissions,
    latestDraftVersion,
    previousPublishedVersion,
    previousVersion,
    selectedLocales,
    versionFrom,
    versionTo,
  } = versionData

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
    renderComponent: RenderServerComponent,
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

  let versionFromOptions: {
    doc: TypeWithVersion<any>
    labelOverride?: string
    updatedAt: Date
    value: string
  }[] = []

  if (previousVersion?.id) {
    versionFromOptions.push({
      doc: previousVersion,
      labelOverride: i18n.t('version:previousVersion'),
      updatedAt: new Date(previousVersion.updatedAt),
      value: previousVersion.id,
    })
  }

  const publishedNewerThanDraft =
    currentlyPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  if (latestDraftVersion && !publishedNewerThanDraft) {
    versionFromOptions.push({
      doc: latestDraftVersion,
      updatedAt: new Date(latestDraftVersion.updatedAt),
      value: latestDraftVersion.id,
    })
  }

  if (currentlyPublishedVersion) {
    versionFromOptions.push({
      doc: currentlyPublishedVersion,
      updatedAt: new Date(currentlyPublishedVersion.updatedAt),
      value: currentlyPublishedVersion.id,
    })
  }

  if (previousPublishedVersion && currentlyPublishedVersion?.id !== previousPublishedVersion.id) {
    versionFromOptions.push({
      doc: previousPublishedVersion,
      labelOverride: i18n.t('version:previouslyPublished'),
      updatedAt: new Date(previousPublishedVersion.updatedAt),
      value: previousPublishedVersion.id,
    })
  }

  if (versionFrom?.id && !versionFromOptions.some((option) => option.value === versionFrom.id)) {
    versionFromOptions.push({
      doc: versionFrom,
      labelOverride: i18n.t('version:specificVersion'),
      updatedAt: new Date(versionFrom.updatedAt),
      value: versionFrom.id,
    })
  }

  versionFromOptions = versionFromOptions.sort((a, b) => {
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

    const labelSuffix = otherOptionsWithSameID?.length ? (
      <span key={`${option.value}-suffix`}>
        {' ('}
        {otherOptionsWithSameID.map((optionWithSameID, index) => {
          const label =
            optionWithSameID.labelOverride ||
            getVersionLabel({
              currentLocale: userLocale,
              currentlyPublishedVersion: currentlyPublishedVersion as any,
              latestDraftVersion: latestDraftVersion as any,
              t: i18n.t,
              version: optionWithSameID.doc as any,
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
