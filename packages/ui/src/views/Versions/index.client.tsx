'use client'
import type { Column, SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { LoadingOverlayToggle } from '../../elements/Loading/index.js'
import { PageControlsComponent } from '../../elements/PageControls/index.js'
import { Table } from '../../elements/Table/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

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
