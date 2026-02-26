'use client'

import React from 'react'

import type { SearchResult } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
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

  const from = results.length > 0 ? 1 : 0
  const to = results.length

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__list`}>
        {results.map((result) => (
          <HierarchySearchResultItem
            id={result.id}
            key={result.id}
            onClick={onSelect}
            path={result.path}
            title={String(result[titleField] || result.id)}
          />
        ))}
      </div>
      <div className={`${baseClass}__footer`}>
        <span className={`${baseClass}__count`}>
          {t('hierarchy:showingResults', { from, to, total: totalDocs })}
        </span>
        {hasNextPage && (
          <button
            className={`${baseClass}__load-more`}
            disabled={isLoading}
            onClick={onLoadMore}
            type="button"
          >
            {isLoading ? '...' : t('general:loadMore')}
          </button>
        )}
      </div>
    </div>
  )
}
