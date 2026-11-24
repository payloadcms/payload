'use client'
import type { ClientCollectionConfig, PaginatedDocs } from 'payload'

import { isNumber } from 'payload/shared'
import React from 'react'

import type { IListQueryContext } from '../../providers/ListQuery/types.js'

import { Pagination } from '../../elements/Pagination/index.js'
import { PerPage } from '../../elements/PerPage/index.js'
import { useTableID } from '../../elements/Table/TableIdentity.js'
import { useEmbed } from '../../providers/Embed/index.js'
import { useListQuery } from '../../providers/ListQuery/context.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'page-controls'

/**
 * The page controls stick to the bottom of the list, and their height changes, for example when
 * they show the list selection. Other content that sticks to the bottom, such as the list drop
 * message, reads this variable from the shared parent element to stay above them.
 */
const heightVariable = '--page-controls-height'

/**
 * @internal
 */
export const PageControlsComponent: React.FC<{
  AfterPageControls?: React.ReactNode
  countLabel?: string
  data: PaginatedDocs
  handlePageChange?: IListQueryContext['handlePageChange']
  handlePerPageChange?: IListQueryContext['handlePerPageChange']
  limit?: number
  limits?: number[]
  tableId?: string
}> = ({
  AfterPageControls,
  countLabel,
  data,
  handlePageChange,
  handlePerPageChange,
  limit,
  limits,
  tableId,
}) => {
  const { isEmbedded } = useEmbed()
  const { i18n } = useTranslation()
  const resolvedTableID = useTableID(tableId)
  const label = countLabel ?? i18n.t(data.totalDocs === 1 ? 'general:item' : 'general:items')
  const pageControlsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const pageControls = pageControlsRef.current
    const parent = pageControls?.parentElement

    if (!pageControls || !parent || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      parent.style.setProperty(heightVariable, `${pageControls.offsetHeight}px`)
    })
    observer.observe(pageControls)

    return () => {
      observer.disconnect()
      parent.style.removeProperty(heightVariable)
    }
  }, [])

  return (
    <div
      className={[baseClass, isEmbedded && `${baseClass}--embedded`].filter(Boolean).join(' ')}
      ref={pageControlsRef}
    >
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
          tableId={resolvedTableID}
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
              <span className="sr-only"> {label}</span>
            </div>
            <PerPage
              handleChange={handlePerPageChange}
              limit={limit}
              limits={limits}
              resetPage={data.totalDocs <= data.pagingCounter}
              tableId={resolvedTableID}
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
  tableId?: string
}> = ({ AfterPageControls, collectionConfig, tableId }) => {
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
      tableId={tableId}
    />
  )
}
