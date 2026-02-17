'use client'

import React from 'react'

import { Button } from '../Button/index.js'
import { TreeConnector } from '../TaxonomyTree/TreeConnector.js'
import './index.scss'

const baseClass = 'load-more-row'

export type LoadMoreRowProps = {
  className?: string
  currentCount: number
  hasMore: boolean
  isLoading?: boolean
  /** Custom button element - if provided, onLoadMore and isLoading are ignored */
  loadMoreButton?: React.ReactNode
  onLoadMore?: () => void
  style?: React.CSSProperties
  totalDocs: number
}

export const LoadMoreRow: React.FC<LoadMoreRowProps> = ({
  className,
  currentCount,
  hasMore,
  isLoading = false,
  loadMoreButton,
  onLoadMore,
  style,
  totalDocs,
}) => {
  const defaultButton = onLoadMore && (
    <Button
      buttonStyle="none"
      className={`${baseClass}__button`}
      disabled={isLoading}
      margin={false}
      onClick={onLoadMore}
    >
      {isLoading ? 'Loading...' : 'Load more'}
    </Button>
  )

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} style={style}>
      <div className={`${baseClass}__connector`}>
        <TreeConnector />
      </div>
      <p className={`${baseClass}__text`}>
        {hasMore ? (
          <>
            Showing {currentCount} of {totalDocs} — {loadMoreButton || defaultButton}
          </>
        ) : (
          <>
            Showing {totalDocs} of {totalDocs}
          </>
        )}
      </p>
    </div>
  )
}
