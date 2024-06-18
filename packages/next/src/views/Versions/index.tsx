import type { EditViewComponent, PaginatedDocs } from 'payload'

import { Gutter, ListQueryProvider } from '@payloadcms/ui/client'
import { notFound } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import React from 'react'

import { SetDocumentStepNav } from '../Edit/Default/SetDocumentStepNav/index.js'
import { buildVersionColumns } from './buildColumns.js'
import { VersionsViewClient } from './index.client.js'
import './index.scss'

export const baseClass = 'versions'

export const VersionsView: EditViewComponent = async (props) => {
  const { initPageResult, searchParams } = props

  const {
    collectionConfig,
    docID: id,
    globalConfig,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
  } = initPageResult

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug
  const { limit, page, sort } = searchParams

  const {
    routes: { api: apiRoute },
    serverURL,
  } = config

  let versionsData: PaginatedDocs
  let limitToUse = isNumber(limit) ? Number(limit) : undefined

  if (collectionSlug) {
    limitToUse = limitToUse || collectionConfig.admin.pagination.defaultLimit
    try {
      versionsData = await payload.findVersions({
        collection: collectionSlug,
        depth: 0,
        limit: limitToUse,
        overrideAccess: false,
        page: page ? parseInt(page.toString(), 10) : undefined,
        sort: sort as string,
        user,
        where: {
          parent: {
            equals: id,
          },
        },
      })
    } catch (error) {
      console.error(error) // eslint-disable-line no-console
    }
  }

  if (globalSlug) {
    limitToUse = limitToUse || 10
    try {
      versionsData = await payload.findGlobalVersions({
        slug: globalSlug,
        depth: 0,
        limit: limitToUse,
        overrideAccess: false,
        page: page ? parseInt(page as string, 10) : undefined,
        sort: sort as string,
        user,
      })
    } catch (error) {
      console.error(error) // eslint-disable-line no-console
    }

    if (!versionsData) {
      return notFound()
    }
  }

  const columns = buildVersionColumns({
    collectionConfig,
    config,
    docID: id,
    globalConfig,
    i18n,
  })

  const fetchURL = collectionSlug
    ? `${serverURL}${apiRoute}/${collectionSlug}/versions`
    : globalSlug
      ? `${serverURL}${apiRoute}/globals/${globalSlug}/versions`
      : ''

  return (
    <React.Fragment>
      <SetDocumentStepNav
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        pluralLabel={collectionConfig?.labels?.plural || globalConfig?.label}
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
