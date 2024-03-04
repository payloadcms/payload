import { Gutter } from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import React from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { SetStepNav } from '../Edit/Default/SetStepNav'
import { sanitizeEditViewProps } from '../Edit/sanitizeEditViewProps'
import { buildVersionColumns } from './buildColumns'
import { VersionsViewClient } from './index.client'
import './index.scss'

export const baseClass = 'versions'

export const VersionsView: React.FC<ServerSideEditViewProps> = async (props) => {
  const { id, initPageResult, searchParams } = props

  const {
    collectionConfig,
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
        page: page ? parseInt(page as string, 10) : undefined,
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

  const clientSideProps = sanitizeEditViewProps(props)

  return (
    <React.Fragment>
      <SetStepNav
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        isEditing
        pluralLabel={collectionConfig?.labels?.plural}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <Gutter className={`${baseClass}__wrap`}>
          <VersionsViewClient
            {...clientSideProps}
            baseClass={baseClass}
            columns={columns}
            fetchURL={fetchURL}
            id={id}
            initialData={versionsData}
            paginationLimits={collectionConfig?.admin?.pagination?.limits}
          />
        </Gutter>
      </main>
    </React.Fragment>
  )
}
