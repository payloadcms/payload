import { Gutter, ListQueryProvider, SetDocumentStepNav } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import { type DocumentViewServerProps, type PaginatedDocs, type Where } from 'payload'
import { isNumber } from 'payload/shared'
import React from 'react'

import { fetchLatestVersion, fetchVersions } from '../Version/fetchVersions.js'
import { VersionDrawerCreatedAtCell } from '../Version/SelectComparison/VersionDrawer/CreatedAtCell.js'
import { buildVersionColumns } from './buildColumns.js'
import { VersionsViewClient } from './index.client.js'
import './index.scss'

const baseClass = 'versions'

export async function VersionsView(props: DocumentViewServerProps) {
  const {
    hasPublishedDoc,
    initPageResult: {
      collectionConfig,
      docID: id,
      globalConfig,
      req,
      req: {
        i18n,
        payload: { config },
        t,
        user,
      },
    },
    searchParams: { limit, page, sort },
    versions: { disableGutter = false, useVersionDrawerCreatedAtCell = false } = {},
  } = props

  const draftsEnabled = (collectionConfig ?? globalConfig)?.versions?.drafts

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const whereQuery: {
    and: Array<{ parent?: { equals: number | string }; snapshot?: { not_equals: boolean } }>
  } & Where = {
    and: [],
  }
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
    overrideAccess: false,
    page: page ? parseInt(page.toString(), 10) : undefined,
    parentID: id,
    req,
    sort: sort as string,
    user,
    where: whereQuery,
  })

  if (!versionsData) {
    return notFound()
  }

  const [currentlyPublishedVersion, latestDraftVersion] = await Promise.all([
    hasPublishedDoc
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          overrideAccess: false,
          parentID: id,
          req,
          select: {
            id: true,
            updatedAt: true,
          },
          status: 'published',
          user,
        })
      : Promise.resolve(null),
    draftsEnabled
      ? fetchLatestVersion({
          collectionSlug,
          depth: 0,
          globalSlug,
          overrideAccess: false,
          parentID: id,
          req,
          select: {
            id: true,
            updatedAt: true,
          },
          status: 'draft',
          user,
        })
      : Promise.resolve(null),
  ])

  const fetchURL = collectionSlug
    ? `${serverURL}${apiRoute}/${collectionSlug}/versions`
    : `${serverURL}${apiRoute}/globals/${globalSlug}/versions`

  const columns = buildVersionColumns({
    collectionConfig,
    CreatedAtCellOverride: useVersionDrawerCreatedAtCell ? VersionDrawerCreatedAtCell : undefined,
    currentlyPublishedVersion,
    docID: id,
    docs: versionsData?.docs,
    globalConfig,
    i18n,
    latestDraftVersion,
  })

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
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle || globalSlug}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <GutterComponent className={`${baseClass}__wrap`}>
          <ListQueryProvider
            data={versionsData}
            defaultLimit={limitToUse}
            defaultSort={sort as string}
            modifySearchParams
            orderableFieldName={collectionConfig?.orderable === true ? '_order' : undefined}
          >
            <VersionsViewClient
              baseClass={baseClass}
              columns={columns}
              fetchURL={fetchURL}
              paginationLimits={collectionConfig?.admin?.pagination?.limits}
            />
          </ListQueryProvider>
        </GutterComponent>
      </main>
    </React.Fragment>
  )
}
