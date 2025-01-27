import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { Gutter } from '../../elements/Gutter'
import { LoadingOverlayToggle } from '../../elements/Loading'
import Paginator from '../../elements/Paginator'
import PerPage from '../../elements/PerPage'
import { Table } from '../../elements/Table'
import Meta from '../../utilities/Meta'
import { useSearchParams } from '../../utilities/SearchParams'
import { SetStepNav } from '../collections/Edit/SetStepNav'
import { buildVersionColumns } from './columns'
import './index.scss'

const baseClass = 'versions'

export const DefaultVersionsView: React.FC<Props> = (props) => {
  const {
    id,
    collection,
    data,
    entityLabel,
    global,
    isLoadingVersions,
    latestDraftVersion,
    latestPublishedVersion,
    versionsData,
  } = props

  const { t } = useTranslation('version')

  const { limit } = useSearchParams()

  const useAsTitle = collection?.admin?.useAsTitle || 'id'

  let metaDesc: string
  let metaTitle: string

  if (collection) {
    metaTitle = `${t('versions')} - ${data[useAsTitle]} - ${entityLabel}`
    metaDesc = t('viewingVersions', { documentTitle: data[useAsTitle], entityLabel })
  }

  if (global) {
    metaTitle = `${t('versions')} - ${entityLabel}`
    metaDesc = t('viewingVersionsGlobal', { entityLabel })
  }

  const versionCount = versionsData?.totalDocs || 0

  return (
    <React.Fragment>
      <SetStepNav collection={collection} global={global} id={id} isEditing view={t('versions')} />
      <LoadingOverlayToggle name="versions" show={isLoadingVersions} />
      <main className={baseClass}>
        <Meta description={metaDesc} title={metaTitle} />
        <Gutter className={`${baseClass}__wrap`}>
          {versionCount === 0 && (
            <div className={`${baseClass}__no-versions`}>{t('noFurtherVersionsFound')}</div>
          )}
          {versionCount > 0 && (
            <React.Fragment>
              {/* <div className={`${baseClass}__version-count`}>
                {t(versionCount === 1 ? 'versionCount_one' : 'versionCount_many', {
                  count: versionCount,
                })}
              </div> */}
              <Table
                columns={buildVersionColumns(
                  collection,
                  global,
                  t,
                  latestDraftVersion,
                  latestPublishedVersion,
                )}
                data={versionsData?.docs}
              />
              <div className={`${baseClass}__page-controls`}>
                <Paginator
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
                      {t('of')} {versionsData.totalDocs}
                    </div>
                    <PerPage
                      limit={limit ? Number(limit) : 10}
                      limits={collection?.admin?.pagination?.limits}
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
