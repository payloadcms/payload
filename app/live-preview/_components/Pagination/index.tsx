import React from 'react'

import { Chevron } from '../Chevron/index.js'
import classes from './index.module.scss'

export const Pagination: React.FC<{
  className?: string
  onClick: (page: number) => void
  page: number
  totalPages: number
}> = (props) => {
  const { className, onClick, page, totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <div className={[classes.pagination, className].filter(Boolean).join(' ')}>
      <button
        className={classes.button}
        disabled={!hasPrevPage}
        onClick={() => {
          onClick(page - 1)
        }}
        type="button"
      >
        <Chevron className={classes.icon} rotate={90} />
      </button>
      <div className={classes.pageRange}>
        <span className={classes.pageRangeLabel}>
          Page {page} of {totalPages}
        </span>
      </div>
      <button
        className={classes.button}
        disabled={!hasNextPage}
        onClick={() => {
          onClick(page + 1)
        }}
        type="button"
      >
        <Chevron className={classes.icon} rotate={-90} />
      </button>
    </div>
  )
}
