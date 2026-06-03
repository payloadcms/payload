import { type DocumentViewServerProps, type PaginatedDocs, type Where } from 'payload'
import { formatAdminURL, hasDraftsEnabled, isNumber } from 'payload/shared'
import React from 'react'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds */
import {
  ListQueryProvider,
  SetDocumentStepNav,
  VersionsViewClient,
} from '../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import { buildVersionColumns } from './buildColumns.js'
import { VersionDrawerCreatedAtCell } from './cells/VersionDrawerCreatedAtCell/index.js'
import { fetchLatestVersion, fetchVersions } from './fetchVersions.js'
import './index.css'

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
    routeSegments: segments,
    searchParams: { limit, page, sort },
    versions: {
      CreatedAtCellOverride,
      disableGutter = false,
      useVersionDrawerCreatedAtCell = false,
    } = {},
  } = props

  const draftsEnabled = hasDraftsEnabled(collectionConfig || globalConfig)

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const isTrashed = segments[2] === 'trash'

  const {
    localization,
    routes: { api: apiRoute },
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
    locale: req.locale,
    overrideAccess: false,
    page: page ? parseInt(page.toString(), 10) : undefined,
    parentID: id,
    req,
    sort: sort as string,
    user,
    where: whereQuery,
  })

  if (!versionsData) {
    return req.server.notFound()
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

  const resolvedCreatedAtCellOverride =
    CreatedAtCellOverride ??
    (useVersionDrawerCreatedAtCell ? VersionDrawerCreatedAtCell : undefined)

  const columns = buildVersionColumns({
    collectionConfig,
    CreatedAtCellOverride: resolvedCreatedAtCellOverride,
    currentlyPublishedVersion,
    docID: id,
    docs: versionsData?.docs,
    globalConfig,
    i18n,
    isTrashed,
    latestDraftVersion,
  })

  const pluralLabel =
    typeof collectionConfig?.labels?.plural === 'function'
      ? collectionConfig.labels.plural({ i18n, t })
      : (collectionConfig?.labels?.plural ?? globalConfig?.label)

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
        <div className={`${baseClass}__wrap`}>
          <ListQueryProvider
            data={versionsData}
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
              fetchURL={fetchURL}
              paginationLimits={collectionConfig?.admin?.pagination?.limits}
            />
          </ListQueryProvider>
        </div>
      </main>
    </React.Fragment>
  )
}
