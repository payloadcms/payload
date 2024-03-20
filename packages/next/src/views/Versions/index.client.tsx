'use client'
import type { PaginatedDocs } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'

import { LoadingOverlayToggle } from '@payloadcms/ui/elements/Loading'
import { Pagination } from '@payloadcms/ui/elements/Pagination'
import { PerPage } from '@payloadcms/ui/elements/PerPage'
import { type Column, Table } from '@payloadcms/ui/elements/Table'
import usePayloadAPI from '@payloadcms/ui/hooks/usePayloadAPI'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { useSearchParams } from 'next/navigation.js'
import React, { Fragment, useEffect, useRef } from 'react'

export const VersionsViewClient: React.FC<{
  baseClass: string
  columns: Column[]
  fetchURL: string
  initialData: PaginatedDocs
  paginationLimits?: SanitizedCollectionConfig['admin']['pagination']['limits']
}> = (props) => {
  const { baseClass, columns, fetchURL, initialData, paginationLimits } = props

  const { getComponentMap } = useComponentMap()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const componentMap = getComponentMap({
    collectionSlug,
    globalSlug,
  })

  const searchParams = useSearchParams()
  const limit = searchParams.get('limit')

  const { i18n } = useTranslation()

  const [{ data, isLoading }, { setParams }] = usePayloadAPI(fetchURL, {
    initialData,
    initialParams: {
      depth: 1,
      limit,
      page: undefined,
      sort: undefined,
      where: {
        parent: {
          equals: id,
        },
      },
    },
  })

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (initialData && !hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    const page = searchParams.get('page')
    const sort = searchParams.get('sort')

    const params = {
      depth: 1,
      limit,
      page: undefined,
      sort: undefined,
      where: {},
    }

    if (page) params.page = page
    if (sort) params.sort = sort

    if (collectionSlug) {
      params.where = {
        parent: {
          equals: id,
        },
      }
    }

    setParams(params)
  }, [id, collectionSlug, searchParams, limit, initialData, setParams])

  const versionCount = data?.totalDocs || 0

  return (
    <Fragment>
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.Versions} />
      <LoadingOverlayToggle name="versions" show={isLoading} />
      {versionCount === 0 && (
        <div className={`${baseClass}__no-versions`}>
          {i18n.t('version:noFurtherVersionsFound')}
        </div>
      )}
      {versionCount > 0 && (
        <React.Fragment>
          <Table columns={columns} data={data?.docs} />
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
                <PerPage limit={limit ? Number(limit) : 10} limits={paginationLimits} />
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
