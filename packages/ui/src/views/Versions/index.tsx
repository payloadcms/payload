import type { DocumentViewServerProps } from 'payload'

import { isNumber } from 'payload/shared'
import React from 'react'

import { Gutter } from '../../elements/Gutter/index.js'
import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { SetDocumentStepNav } from '../Edit/SetDocumentStepNav/index.js'
import { VersionDrawerCreatedAtCell } from '../Version/SelectComparison/VersionDrawer/CreatedAtCell.js'
import { buildVersionColumns } from './buildColumns.js'
import { getVersionsViewData } from './getVersionsViewData.js'
import { VersionsViewClient } from './index.client.js'
import './index.css'

const baseClass = 'versions'

export type VersionsViewProps = {
  onNotFound?: () => never
} & DocumentViewServerProps

export async function VersionsView(props: VersionsViewProps) {
  const {
    hasPublishedDoc,
    initPageResult: {
      collectionConfig,
      docID: id,
      globalConfig,
      req,
      req: { i18n, t },
    },
    onNotFound,
    routeSegments: segments,
    searchParams: { limit, page, sort },
    versions: { disableGutter = false, useVersionDrawerCreatedAtCell = false } = {},
  } = props

  const isTrashed = segments[2] === 'trash'

  const defaultLimit = collectionConfig?.slug
    ? collectionConfig?.admin?.pagination?.defaultLimit
    : 10

  const limitToUse = isNumber(limit) ? Number(limit) : defaultLimit

  let versionsData
  try {
    versionsData = await getVersionsViewData({
      id,
      collectionConfig,
      globalConfig,
      hasPublishedDoc,
      limit: limitToUse,
      page: page ? parseInt(String(page), 10) : undefined,
      req,
      sort: sort as string,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found' && onNotFound) {
      return onNotFound()
    }
    throw err
  }

  const columns = buildVersionColumns({
    collectionConfig,
    CreatedAtCellOverride: useVersionDrawerCreatedAtCell ? VersionDrawerCreatedAtCell : undefined,
    currentlyPublishedVersion: versionsData.currentlyPublishedVersion,
    docID: id,
    docs: versionsData.versionsData?.docs,
    globalConfig,
    i18n,
    isTrashed,
    latestDraftVersion: versionsData.latestDraftVersion,
  })

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const pluralLabel =
    typeof collectionConfig?.labels?.plural === 'function'
      ? collectionConfig.labels.plural({ i18n, t })
      : (collectionConfig?.labels?.plural ?? globalConfig?.label)

  const GutterComponent = disableGutter ? React.Fragment : Gutter

  return (
    <React.Fragment>
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalSlug={globalSlug}
        id={id}
        isTrashed={isTrashed}
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle || globalSlug}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <GutterComponent className={`${baseClass}__wrap`}>
          <ListQueryProvider
            data={versionsData.versionsData}
            modifySearchParams
            orderableFieldName={collectionConfig?.orderable === true ? '_order' : undefined}
            query={{
              limit: limitToUse,
              sort: sort as string,
            }}
          >
            <VersionsViewClient
              baseClass={baseClass}
              columns={columns}
              fetchURL={versionsData.fetchURL}
              paginationLimits={collectionConfig?.admin?.pagination?.limits}
            />
          </ListQueryProvider>
        </GutterComponent>
      </main>
    </React.Fragment>
  )
}
