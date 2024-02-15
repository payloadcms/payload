import React from 'react'

import { Gutter, SetDocumentStepNav as SetStepNav, ServerSideEditViewProps } from '@payloadcms/ui'
import { buildVersionColumns } from './buildColumns'
import { notFound } from 'next/navigation'
import { getTranslation } from '@payloadcms/translations'
import { VersionsViewClient } from './index.client'

import './index.scss'

export const baseClass = 'versions'

export const VersionsView: React.FC<ServerSideEditViewProps> = async (props) => {
  const { user, payload, config, searchParams, i18n } = props

  const id = 'id' in props ? props.id : undefined
  const collectionConfig = 'collectionConfig' in props && props?.collectionConfig
  const globalConfig = 'globalConfig' in props && props?.globalConfig

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug
  const { limit, page, sort } = searchParams

  const {
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  let docURL: string
  let entityLabel: string
  let slug: string
  let editURL: string
  let versionsData

  if (collectionSlug) {
    try {
      versionsData = await payload.findVersions({
        collection: collectionSlug,
        depth: 0,
        user,
        page: page ? parseInt(page.toString(), 10) : undefined,
        sort: sort as string,
        limit: limit ? parseInt(limit?.toString(), 10) : undefined,
        where: {
          parent: {
            equals: id,
          },
        },
      })
    } catch (error) {
      console.error(error)
    }

    docURL = `${serverURL}${apiRoute}/${slug}/${id}`
    entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    editURL = `${adminRoute}/collections/${collectionSlug}/${id}`
  }

  if (globalSlug) {
    try {
      versionsData = await payload.findGlobalVersions({
        slug: globalSlug,
        depth: 0,
        user,
        page: page ? parseInt(page as string, 10) : undefined,
        sort: sort as string,
        where: {
          parent: {
            equals: id,
          },
        },
      })
    } catch (error) {
      console.error(error)
    }

    if (!versionsData) {
      return notFound()
    }

    docURL = `${serverURL}${apiRoute}/globals/${globalSlug}`
    entityLabel = getTranslation(globalConfig.label, i18n)
    editURL = `${adminRoute}/globals/${globalSlug}`
  }

  const columns = buildVersionColumns({
    config,
    collectionConfig,
    globalConfig,
    docID: id,
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
        isEditing
        pluralLabel={collectionConfig?.labels?.plural}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <Gutter className={`${baseClass}__wrap`}>
          <VersionsViewClient
            initialData={versionsData}
            columns={columns}
            fetchURL={fetchURL}
            baseClass={baseClass}
            collectionSlug={collectionSlug}
            globalSlug={globalSlug}
            id={id}
            paginationLimits={collectionConfig?.admin?.pagination?.limits}
          />
        </Gutter>
      </main>
    </React.Fragment>
  )
}
