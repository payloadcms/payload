'use client'
import type { Column, SanitizedCollectionConfig } from 'payload'

import {
  LoadingOverlayToggle,
  PageControlsComponent,
  Table,
  useListQuery,
  useTranslation,
} from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation.js'
import React from 'react'

export const VersionsViewClient: React.FC<{
  readonly baseClass: string
  readonly columns: Column[]
  readonly fetchURL: string
  readonly paginationLimits?: SanitizedCollectionConfig['admin']['pagination']['limits']
}> = (props) => {
  const { baseClass, columns, paginationLimits } = props

  const { data, handlePageChange, handlePerPageChange } = useListQuery()

  const searchParams = useSearchParams()
  const limit = searchParams.get('limit')

  const { i18n } = useTranslation()

  const versionCount = data?.totalDocs || 0

  return (
    <React.Fragment>
      <LoadingOverlayToggle name="versions" show={!data} />
      {versionCount === 0 && (
        <div className={`${baseClass}__no-versions`}>
          {i18n.t('version:noFurtherVersionsFound')}
        </div>
      )}
      {versionCount > 0 && (
        <React.Fragment>
          <Table columns={columns} data={data?.docs} />
          <PageControlsComponent
            data={data}
            handlePageChange={handlePageChange}
            handlePerPageChange={handlePerPageChange}
            limit={limit ? Number(limit) : 10}
            limits={paginationLimits}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  )
}
