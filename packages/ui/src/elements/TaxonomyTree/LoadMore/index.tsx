'use client'

import React from 'react'

import { LoadMoreRow } from '../../LoadMoreRow/index.js'
import { LoadMoreButton } from './LoadMoreButton.js'
import './index.scss'

type LoadMoreProps = {
  currentCount: number
  depth: number
  id: string
  onLoadMore: (() => Promise<void>) | (() => void)
  totalDocs: number
}

export const LoadMore: React.FC<LoadMoreProps> = ({
  id,
  currentCount,
  depth,
  onLoadMore,
  totalDocs,
}) => {
  return (
    <LoadMoreRow
      className="taxonomy-tree__load-more"
      currentCount={currentCount}
      hasMore={currentCount < totalDocs}
      loadMoreButton={<LoadMoreButton id={id} onLoadMore={onLoadMore} />}
      style={{ '--taxonomy-tree-depth': depth } as React.CSSProperties}
      totalDocs={totalDocs}
    />
  )
}
