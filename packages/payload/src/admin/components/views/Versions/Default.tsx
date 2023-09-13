import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { StepNavItem } from '../../elements/StepNav/types'
import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { Gutter } from '../../elements/Gutter'
import { LoadingOverlayToggle } from '../../elements/Loading'
import Paginator from '../../elements/Paginator'
import PerPage from '../../elements/PerPage'
import { useStepNav } from '../../elements/StepNav'
import { Table } from '../../elements/Table'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import { useSearchParams } from '../../utilities/SearchParams'
import { buildVersionColumns } from './columns'
import './index.scss'

const baseClass = 'versions'

export const DefaultVersionsView: React.FC<Props> = (props) => {
  const { collection, data, editURL, entityLabel, global, id, isLoadingVersions, versionsData } =
    props

  const {
    routes: { admin },
  } = useConfig()

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation('version')

  const { limit } = useSearchParams()

  const useAsTitle = collection?.admin?.useAsTitle || 'id'

  useEffect(() => {
    let nav: StepNavItem[] = []

    if (collection) {
      let docLabel = ''

      if (data) {
        if (useAsTitle) {
          if (data[useAsTitle]) {
            docLabel = data[useAsTitle]
          } else {
            docLabel = `[${t('general:untitled')}]`
          }
        } else {
          docLabel = data.id
        }
      }

      nav = [
        {
          label: getTranslation(collection.labels.plural, i18n),
          url: `${admin}/collections/${collection.slug}`,
        },
        {
          label: docLabel,
          url: editURL,
        },
        {
          label: t('versions'),
        },
      ]
    }

    if (global) {
      nav = [
        {
          label: getTranslation(global.label, i18n),
          url: editURL,
        },
        {
          label: t('versions'),
        },
      ]
    }

    setStepNav(nav)
  }, [setStepNav, collection, global, useAsTitle, data, admin, id, editURL, t, i18n])

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

  return (
    <React.Fragment>
      <LoadingOverlayToggle name="versions" show={isLoadingVersions} />
      <div className={baseClass}>
        <Meta description={metaDesc} title={metaTitle} />
        <Gutter className={`${baseClass}__wrap`}>
          {versionsData?.totalDocs > 0 && (
            <React.Fragment>
              <Table
                columns={buildVersionColumns(collection, global, t)}
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
          {versionsData?.totalDocs === 0 && (
            <div className={`${baseClass}__no-versions`}>{t('noFurtherVersionsFound')}</div>
          )}
        </Gutter>
      </div>
    </React.Fragment>
  )
}
