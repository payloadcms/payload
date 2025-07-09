import type { ClientCollectionConfig } from 'payload'

import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import { Pagination } from '../../elements/Pagination/index.js'
import { PerPage } from '../../elements/PerPage/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'page-controls'

export const PageControls: React.FC<{
  AfterPageControls?: React.ReactNode
  collectionConfig: ClientCollectionConfig
}> = ({ AfterPageControls, collectionConfig }) => {
  const {
    data,
    defaultLimit: initialLimit,
    handlePageChange,
    handlePerPageChange,
    query,
  } = useListQuery()

  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      <Pagination
        hasNextPage={data.hasNextPage}
        hasPrevPage={data.hasPrevPage}
        limit={data.limit}
        nextPage={data.nextPage}
        numberOfNeighbors={1}
        onChange={(page) => void handlePageChange(page)}
        page={data.page}
        prevPage={data.prevPage}
        totalPages={data.totalPages}
      />
      {data.totalDocs > 0 && (
        <Fragment>
          <div className={`${baseClass}__page-info`}>
            {data.page * data.limit - (data.limit - 1)}-
            {data.totalPages > 1 && data.totalPages !== data.page
              ? data.limit * data.page
              : data.totalDocs}{' '}
            {i18n.t('general:of')} {data.totalDocs}
          </div>
          <PerPage
            handleChange={(limit) => void handlePerPageChange(limit)}
            limit={isNumber(query?.limit) ? Number(query.limit) : initialLimit}
            limits={collectionConfig?.admin?.pagination?.limits}
            resetPage={data.totalDocs <= data.pagingCounter}
          />
          {AfterPageControls}
        </Fragment>
      )}
    </div>
  )
}
