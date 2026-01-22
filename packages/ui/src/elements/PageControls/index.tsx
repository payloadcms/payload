'use client'
import type { ClientCollectionConfig, PaginatedDocs } from 'payload'

import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'


import { Pagination } from '../../elements/Pagination/index.js'
import { PerPage } from '../../elements/PerPage/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'page-controls'

/**
 * @internal
 */
export const PageControlsComponent: React.FC<{
  AfterPageControls?: React.ReactNode
  collectionConfig: ClientCollectionConfig
  data: PaginatedDocs
  handlePageChange?: (page: number) => void
  handlePerPageChange?: (limit: number) => void
  limit?: number
}> = ({
  AfterPageControls,
  collectionConfig,
  data,
  handlePageChange,
  handlePerPageChange,
  limit,
}) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      <Pagination
        hasNextPage={data.hasNextPage}
        hasPrevPage={data.hasPrevPage}
        limit={data.limit}
        nextPage={data.nextPage}
        numberOfNeighbors={1}
        onChange={handlePageChange}
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
            handleChange={handlePerPageChange}
            limit={limit}
            limits={collectionConfig?.admin?.pagination?.limits}
            resetPage={data.totalDocs <= data.pagingCounter}
          />
          {AfterPageControls}
        </Fragment>
      )}
    </div>
  )
}

/**
 * These page controls are controlled by the global ListQuery state.
 * To override thi behavior, build your own wrapper around PageControlsComponent.
 *
 * @internal
 */
export const PageControls: React.FC<{
  AfterPageControls?: React.ReactNode
  collectionConfig: ClientCollectionConfig
}> = ({ AfterPageControls, collectionConfig }) => {
  const { data, defaultLimit: initialLimit, query, setQuery } = useListQuery()

  return (
    <PageControlsComponent
      AfterPageControls={AfterPageControls}
      collectionConfig={collectionConfig}
      data={data}
      handlePageChange={(page) => setQuery({ page })}
      handlePerPageChange={(limit) => setQuery({ limit, page: 1 })}
      limit={isNumber(query.limit) ? query.limit : initialLimit}
    />
  )
}
