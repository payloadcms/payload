import { Gutter, ListQueryProvider, SetDocumentStepNav } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import { type DocumentViewServerProps, logError, type PaginatedDocs } from 'payload'
import { isNumber } from 'payload/shared'
import React from 'react'

import { buildVersionColumns } from './buildColumns.js'
import { getLatestVersion } from './getLatestVersion.js'
import { VersionsViewClient } from './index.client.js'
import './index.scss'

export const baseClass = 'versions'

export async function VersionsView(props: DocumentViewServerProps) {
  const { initPageResult, searchParams } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      t,
      user,
    },
  } = initPageResult

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug
  const { limit, page, sort } = searchParams

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  let versionsData: PaginatedDocs
  let limitToUse = isNumber(limit) ? Number(limit) : undefined
  let latestPublishedVersion = null
  let latestDraftVersion = null

  if (collectionSlug) {
    limitToUse = limitToUse || collectionConfig.admin.pagination.defaultLimit
    const whereQuery: {
      and: Array<{ parent?: { equals: number | string }; snapshot?: { not_equals: boolean } }>
    } = {
      and: [
        {
          parent: {
            equals: id,
          },
        },
      ],
    }

    if (localization && collectionConfig?.versions?.drafts) {
      whereQuery.and.push({
        snapshot: {
          not_equals: true,
        },
      })
    }

    try {
      versionsData = await payload.findVersions({
        collection: collectionSlug,
        depth: 0,
        limit: limitToUse,
        overrideAccess: false,
        page: page ? parseInt(page.toString(), 10) : undefined,
        req,
        sort: sort as string,
        user,
        where: whereQuery,
      })
      if (collectionConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug: collectionSlug,
          type: 'collection',
          parentID: id,
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug: collectionSlug,
          type: 'collection',
          parentID: id,
          payload,
          status: 'published',
        })
      }
    } catch (err) {
      logError({ err, payload })
    }
  }

  if (globalSlug) {
    limitToUse = limitToUse || 10
    const whereQuery =
      localization && globalConfig?.versions?.drafts
        ? {
            snapshot: {
              not_equals: true,
            },
          }
        : {}

    try {
      versionsData = await payload.findGlobalVersions({
        slug: globalSlug,
        depth: 0,
        limit: limitToUse,
        overrideAccess: false,
        page: page ? parseInt(page as string, 10) : undefined,
        req,
        sort: sort as string,
        user,
        where: whereQuery,
      })

      if (globalConfig?.versions?.drafts) {
        latestDraftVersion = await getLatestVersion({
          slug: globalSlug,
          type: 'global',
          payload,
          status: 'draft',
        })
        latestPublishedVersion = await getLatestVersion({
          slug: globalSlug,
          type: 'global',
          payload,
          status: 'published',
        })
      }
    } catch (err) {
      logError({ err, payload })
    }

    if (!versionsData) {
      return notFound()
    }
  }
  const fetchURL = collectionSlug
    ? `${serverURL}${apiRoute}/${collectionSlug}/versions`
    : globalSlug
      ? `${serverURL}${apiRoute}/globals/${globalSlug}/versions`
      : ''

  const publishedNewerThanDraft = latestPublishedVersion?.updatedAt > latestDraftVersion?.updatedAt

  if (publishedNewerThanDraft) {
    latestDraftVersion = {
      id: '',
      updatedAt: '',
    }
  }

  const columns = buildVersionColumns({
    collectionConfig,
    config,
    docID: id,
    docs: versionsData?.docs,
    globalConfig,
    i18n,
    latestDraftVersion: latestDraftVersion?.id,
    latestPublishedVersion: latestPublishedVersion?.id,
  })

  const pluralLabel = collectionConfig?.labels?.plural
    ? typeof collectionConfig.labels.plural === 'function'
      ? collectionConfig.labels.plural({ i18n, t })
      : collectionConfig.labels.plural
    : globalConfig?.label

  return (
    <React.Fragment>
      <SetDocumentStepNav
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle || globalConfig?.slug}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <Gutter className={`${baseClass}__wrap`}>
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
        </Gutter>
      </main>
    </React.Fragment>
  )
}
