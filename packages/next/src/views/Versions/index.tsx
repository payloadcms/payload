import type { EditViewComponent } from 'payload/types'

import { Gutter } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { SetStepNav } from '../Edit/Default/SetStepNav/index.js'
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

  let versionsData

  if (collectionSlug) {
    try {
      versionsData = await payload.findVersions({
        collection: collectionSlug,
        depth: 0,
        limit: limit ? parseInt(limit?.toString(), 10) : undefined,
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
    try {
      versionsData = await payload.findGlobalVersions({
        slug: globalSlug,
        depth: 0,
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
      <SetStepNav
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        pluralLabel={collectionConfig?.labels?.plural}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <Gutter className={`${baseClass}__wrap`}>
          <VersionsViewClient
            baseClass={baseClass}
            columns={columns}
            fetchURL={fetchURL}
            initialData={versionsData}
            paginationLimits={collectionConfig?.admin?.pagination?.limits}
          />
        </Gutter>
      </main>
    </React.Fragment>
  )
}
