'use client'

import React from 'react'

import { TreeConnector } from '../TreeConnector.js'
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
    <div
      className="taxonomy-tree__load-more"
      style={{ '--taxonomy-tree-depth': depth } as React.CSSProperties}
    >
      <div className="taxonomy-tree__load-more-connector-container">
        <TreeConnector className="taxonomy-tree__load-more-connector" />
      </div>
      <p className="taxonomy-tree__load-more-text">
        Showing {currentCount} of {totalDocs} — <LoadMoreButton id={id} onLoadMore={onLoadMore} />
      </p>
    </div>
  )
}
