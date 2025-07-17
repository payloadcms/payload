'use client'

import type { PaginatedDocs } from 'payload'

import { isNumber } from 'payload/shared'

import { useFolderQueryParams } from '../../../providers/FolderQueryParams/context.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Pagination } from '../../Pagination/index.js'
import { PerPage } from '../../PerPage/index.js'
import './index.scss'

const baseClass = 'folder-documents-pagination'

type Props = {
  readonly className?: string
  readonly limits: number[]
} & Omit<PaginatedDocs, 'docs'>

export const FolderDocumentsPagination = (props: Props) => {
  const { i18n } = useTranslation()
  const { defaultDocLimit, handleDocPageChange, handleDocPerPageChange, query } =
    useFolderQueryParams()

  return (
    <div className={[baseClass, props.className].filter(Boolean).join(' ')}>
      <Pagination {...props} onChange={handleDocPageChange} />

      <div className={`${baseClass}__page-controls`}>
        <div className={`${baseClass}__page-info`}>
          {props.page * props.limit - (props.limit - 1)}-
          {props.totalPages > 1 && props.totalPages !== props.page
            ? props.limit * props.page
            : props.totalDocs}{' '}
          {i18n.t('general:of')} {props.totalDocs}
        </div>
        <PerPage
          handleChange={(limit) => void handleDocPerPageChange(limit)}
          limit={isNumber(query?.docLimit) ? Number(query.docLimit) : defaultDocLimit}
          limits={props.limits}
          resetPage={props.totalDocs <= props.pagingCounter}
        />
      </div>
    </div>
  )
}
