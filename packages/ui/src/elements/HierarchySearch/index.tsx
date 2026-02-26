'use client'

import React, { useCallback, useState } from 'react'

import type { HierarchySearchProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { HierarchySearchInput } from './HierarchySearchInput.js'
import { HierarchySearchResults } from './HierarchySearchResults.js'
import { useHierarchySearch } from './useHierarchySearch.js'
import './index.scss'

const baseClass = 'hierarchy-search'
const MIN_CHARS = 2

export const HierarchySearch: React.FC<HierarchySearchProps> = ({
  collectionSlug,
  isActive,
  onActiveChange,
  onSelect,
}) => {
  const { t } = useTranslation()
  const { getEntityConfig } = useConfig()
  const [inputValue, setInputValue] = useState('')

  const collectionConfig = getEntityConfig({ collectionSlug })
  const titleField = collectionConfig?.admin?.useAsTitle || 'id'

  const { clearResults, hasNextPage, isLoading, loadMore, results, search, totalDocs } =
    useHierarchySearch({
      collectionSlug,
      titleField,
    })

  const handleSearch = useCallback(
    async (query: string) => {
      await search(query)
      onActiveChange(true)
    },
    [search, onActiveChange],
  )

  const handleClear = useCallback(() => {
    setInputValue('')
    clearResults()
    onActiveChange(false)
  }, [clearResults, onActiveChange])

  const handleSelect = useCallback(
    (id: number | string) => {
      onSelect(id)
      handleClear()
    },
    [onSelect, handleClear],
  )

  return (
    <div className={baseClass}>
      <HierarchySearchInput
        minChars={MIN_CHARS}
        onChange={setInputValue}
        onClear={handleClear}
        onSearch={handleSearch}
        placeholder={t('hierarchy:search')}
        value={inputValue}
      />
      {isActive && (
        <HierarchySearchResults
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onLoadMore={loadMore}
          onSelect={handleSelect}
          query={inputValue}
          results={results}
          titleField={titleField}
          totalDocs={totalDocs}
        />
      )}
    </div>
  )
}

export { HierarchySearchInput } from './HierarchySearchInput.js'
export { HierarchySearchResultItem } from './HierarchySearchResultItem.js'
export { HierarchySearchResults } from './HierarchySearchResults.js'
export type { HierarchySearchProps, SearchResult } from './types.js'
export { useHierarchySearch } from './useHierarchySearch.js'
