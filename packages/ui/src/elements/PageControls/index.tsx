'use client'
import type { ClientCollectionConfig, PaginatedDocs } from 'payload'

import { isNumber } from 'payload/shared'
import React from 'react'

import type { IListQueryContext } from '../../providers/ListQuery/types.js'

import { Pagination } from '../../elements/Pagination/index.js'
import { PerPage } from '../../elements/PerPage/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'page-controls'

/**
 * @internal
 */
export const PageControlsComponent: React.FC<{
  AfterPageControls?: React.ReactNode
  data: PaginatedDocs
  handlePageChange?: IListQueryContext['handlePageChange']
  handlePerPageChange?: IListQueryContext['handlePerPageChange']
  limit?: number
  limits?: number[]
}> = ({ AfterPageControls, data, handlePageChange, handlePerPageChange, limit, limits }) => {
  const { i18n } = useTranslation()

  return (
    <div className={baseClass}>
      {AfterPageControls}
      <div className={`${baseClass}__inner`}>
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
          <div className={`${baseClass}__per-page-container`}>
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
              limits={limits}
              resetPage={data.totalDocs <= data.pagingCounter}
            />
          </div>
        )}
      </div>
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
  const {
    data,
    defaultLimit: initialLimit,
    handlePageChange,
    handlePerPageChange,
    query,
  } = useListQuery()

  return (
    <PageControlsComponent
      AfterPageControls={AfterPageControls}
      data={data}
      handlePageChange={handlePageChange}
      handlePerPageChange={handlePerPageChange}
      limit={isNumber(query.limit) ? query.limit : initialLimit}
      limits={collectionConfig?.admin?.pagination?.limits}
    />
  )
}
