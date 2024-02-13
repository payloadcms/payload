import React from 'react'

import {
  Gutter,
  Pagination,
  PerPage,
  Table,
  SetDocumentStepNav as SetStepNav,
  ServerSideEditViewProps,
} from '@payloadcms/ui'
import { buildVersionColumns } from './columns'
import { notFound } from 'next/navigation'
import { getTranslation } from '@payloadcms/translations'

import './index.scss'

const baseClass = 'versions'

export const VersionsView: React.FC<ServerSideEditViewProps> = async (props) => {
  const { user, payload, config, searchParams, i18n } = props

  const id = 'id' in props ? props.id : undefined
  const collectionConfig = 'collectionConfig' in props && props?.collectionConfig
  const globalConfig = 'globalConfig' in props && props?.globalConfig

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug
  const { limit, page, sort } = searchParams

  const {
    routes: { admin, api },
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
        page: page ? parseInt(page as string, 10) : undefined,
        sort: sort as string,
        // TODO: why won't this work?!
        // throws an `unsupported BSON` error
        // where: {
        //   parent: {
        //     equals: id,
        //   },
        // },
      })
    } catch (error) {
      console.error(error)
    }

    docURL = `${serverURL}${api}/${slug}/${id}`
    entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    editURL = `${admin}/collections/${collectionSlug}/${id}`
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

    docURL = `${serverURL}${api}/globals/${globalSlug}`
    entityLabel = getTranslation(globalConfig.label, i18n)
    editURL = `${admin}/globals/${globalSlug}`
  }

  // useEffect(() => {
  //   const editConfig = (collection || global)?.admin?.components?.views?.Edit
  //   const versionsActions =
  //     editConfig && 'Versions' in editConfig && 'actions' in editConfig.Versions
  //       ? editConfig.Versions.actions
  //       : []

  //   setViewActions(versionsActions)
  // }, [collection, global, setViewActions])

  const versionCount = versionsData?.totalDocs || 0

  const columns = buildVersionColumns({
    config,
    collectionConfig,
    globalConfig,
    docID: id,
    i18n,
  })

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
      {/* <LoadingOverlayToggle name="versions" show={isLoadingVersions} /> */}
      <main className={baseClass}>
        {/* <Meta description={metaDesc} title={metaTitle} /> */}
        <Gutter className={`${baseClass}__wrap`}>
          {versionCount === 0 && (
            <div className={`${baseClass}__no-versions`}>
              {i18n.t('version:noFurtherVersionsFound')}
            </div>
          )}
          {versionCount > 0 && (
            <React.Fragment>
              <div className={`${baseClass}__version-count`}>
                {i18n.t(
                  versionCount === 1 ? 'version:versionCount_one' : 'version:versionCount_many',
                  {
                    count: versionCount,
                  },
                )}
              </div>
              <Table columns={columns} data={versionsData?.docs} />
              <div className={`${baseClass}__page-controls`}>
                <Pagination
                  hasNextPage={versionsData.hasNextPage}
                  hasPrevPage={versionsData.hasPrevPage}
                  limit={versionsData.limit}
                  nextPage={versionsData.nextPage}
                  numberOfNeighbors={1}
                  page={versionsData.page}
                  prevPage={versionsData.prevPage}
                  totalPages={versionsData.totalPages}
                />
                {versionsData?.totalDocs > 0 && (
                  <React.Fragment>
                    <div className={`${baseClass}__page-info`}>
                      {versionsData.page * versionsData.limit - (versionsData.limit - 1)}-
                      {versionsData.totalPages > 1 && versionsData.totalPages !== versionsData.page
                        ? versionsData.limit * versionsData.page
                        : versionsData.totalDocs}{' '}
                      {i18n.t('general:of')} {versionsData.totalDocs}
                    </div>
                    <PerPage
                      limit={limit ? Number(limit) : 10}
                      limits={collectionConfig?.admin?.pagination?.limits}
                    />
                  </React.Fragment>
                )}
              </div>
            </React.Fragment>
          )}
        </Gutter>
      </main>
    </React.Fragment>
  )
}
