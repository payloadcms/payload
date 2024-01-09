import React from 'react'

import type { DefaultVersionsViewProps } from './types'

import {
  Gutter,
  Pagination,
  PerPage,
  Table,
  SetDocumentStepNav as SetStepNav,
} from '@payloadcms/ui'
import { buildVersionColumns } from '../columns'
import './index.scss'

const baseClass = 'versions'

export const DefaultVersionsView: React.FC<DefaultVersionsViewProps> = (props) => {
  const {
    id,
    config,
    collectionConfig,
    data,
    entityLabel,
    globalConfig,
    versionsData,
    limit,
    i18n,
  } = props

  // const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'

  // let metaDesc: string
  // let metaTitle: string

  // if (collection) {
  //   metaTitle = `${t('versions')} - ${data[useAsTitle]} - ${entityLabel}`
  //   metaDesc = t('viewingVersions', { documentTitle: data[useAsTitle], entityLabel })
  // }

  // if (global) {
  //   metaTitle = `${t('versions')} - ${entityLabel}`
  //   metaDesc = t('viewingVersionsGlobal', { entityLabel })
  // }

  const versionCount = versionsData?.totalDocs || 0

  return (
    <React.Fragment>
      <SetStepNav
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        isEditing
        view={i18n.t('general:versions')}
        pluralLabel={collectionConfig?.labels?.plural}
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
              <Table
                columns={buildVersionColumns({
                  config,
                  collectionConfig,
                  globalConfig,
                  docID: id,
                  t: i18n.t,
                })}
                data={versionsData?.docs}
              />
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
