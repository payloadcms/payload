'use client'

import React from 'react'

import type { SearchResult } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { LoadMoreRow } from '../LoadMoreRow/index.js'
import { HierarchySearchResultItem } from './HierarchySearchResultItem.js'

const baseClass = 'hierarchy-search-results'

type HierarchySearchResultsProps = {
  hasNextPage: boolean
  isLoading: boolean
  onLoadMore: () => void
  onSelect: (id: number | string) => void
  query: string
  results: SearchResult[]
  titleField: string
  totalDocs: number
}

export const HierarchySearchResults: React.FC<HierarchySearchResultsProps> = ({
  hasNextPage,
  isLoading,
  onLoadMore,
  onSelect,
  query,
  results,
  titleField,
  totalDocs,
}) => {
  const { t } = useTranslation()

  if (results.length === 0 && !isLoading) {
    return <div className={`${baseClass}__empty`}>{t('hierarchy:noResults', { query })}</div>
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__list`}>
        {results.map((result) => (
          <HierarchySearchResultItem
            id={result.id}
            key={result.id}
            onClick={onSelect}
            path={result.path}
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            title={String(result[titleField] || result.id)}
          />
        ))}
      </div>
      <LoadMoreRow
        className={`${baseClass}__load-more`}
        currentCount={results.length}
        hasMore={hasNextPage}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        totalDocs={totalDocs}
      />
    </div>
  )
}
