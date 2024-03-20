'use client'
import type { PaginatedDocs } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { LoadingOverlayToggle } from '@payloadcms/ui/elements/Loading'
import { Pagination } from '@payloadcms/ui/elements/Pagination'
import { PerPage } from '@payloadcms/ui/elements/PerPage'
import { type Column, Table } from '@payloadcms/ui/elements/Table'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useListQuery } from '@payloadcms/ui/providers/ListQuery'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { useSearchParams } from 'next/navigation.js'
import React from 'react'

export const VersionsViewClient: React.FC<{
  baseClass: string
  columns: Column[]
  fetchURL: string
  paginationLimits?: SanitizedCollectionConfig['admin']['pagination']['limits']
}> = (props) => {
  const { baseClass, columns, paginationLimits } = props

  const { getComponentMap } = useComponentMap()
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { data, handlePerPageChange } = useListQuery()

  const componentMap = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  const searchParams = useSearchParams()
  const limit = searchParams.get('limit')

  const { i18n } = useTranslation()

  const versionCount = data?.totalDocs || 0

  return (
    <React.Fragment>
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.Versions} />
      <LoadingOverlayToggle name="versions" show={!data} />
      {versionCount === 0 && (
        <div className={`${baseClass}__no-versions`}>
          {i18n.t('version:noFurtherVersionsFound')}
        </div>
      )}
      {versionCount > 0 && (
        <React.Fragment>
          <Table columns={columns} data={data?.docs} fieldMap={componentMap?.fieldMap} />
          <div className={`${baseClass}__page-controls`}>
            <Pagination
              hasNextPage={data.hasNextPage}
              hasPrevPage={data.hasPrevPage}
              limit={data.limit}
              nextPage={data.nextPage}
              numberOfNeighbors={1}
              page={data.page}
              prevPage={data.prevPage}
              totalPages={data.totalPages}
            />
            {data?.totalDocs > 0 && (
              <React.Fragment>
                <div className={`${baseClass}__page-info`}>
                  {data.page * data.limit - (data.limit - 1)}-
                  {data.totalPages > 1 && data.totalPages !== data.page
                    ? data.limit * data.page
                    : data.totalDocs}{' '}
                  {i18n.t('general:of')} {data.totalDocs}
                </div>
                <PerPage
                  handleChange={handlePerPageChange}
                  limit={limit ? Number(limit) : 10}
                  limits={paginationLimits}
                />
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  )
}
