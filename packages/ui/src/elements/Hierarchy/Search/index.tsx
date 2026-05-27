'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useState } from 'react'

import type { HierarchySearchProps } from './types.js'

import { CheckIcon } from '../../../icons/Check/index.js'
import { FilterIcon } from '../../../icons/Filter/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { Popup, PopupList } from '../../Popup/index.js'
import { HierarchySearchInput } from './HierarchySearchInput.js'
import { HierarchySearchResults } from './HierarchySearchResults.js'
import { useHierarchySearch } from './useHierarchySearch.js'
import './index.css'

const baseClass = 'hierarchy-search'

export const HierarchySearch: React.FC<HierarchySearchProps> = ({
  collectionSlug,
  collectionSpecificOptions,
  isActive,
  onActiveChange,
  onFilterChange,
  onSelect,
  selectedFilters,
}) => {
  const { i18n, t } = useTranslation()
  const { getEntityConfig } = useConfig()
  const [inputValue, setInputValue] = useState('')

  const collectionConfig = getEntityConfig({ collectionSlug })
  const titleField = collectionConfig?.admin?.useAsTitle || 'id'
  const collectionLabel = getTranslation(collectionConfig?.labels?.plural, i18n)
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : null

  const { clearResults, hasNextPage, isLoading, loadMore, results, search, totalDocs } =
    useHierarchySearch({
      collectionSlug,
      parentFieldName: hierarchyConfig?.parentFieldName,
      titleField,
      titlePathField: hierarchyConfig?.titlePathFieldName,
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

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value)
      if (!value && isActive) {
        clearResults()
        onActiveChange(false)
      }
    },
    [isActive, clearResults, onActiveChange],
  )

  const handleSelect = useCallback(
    ({ id }: { id: number | string }) => {
      onSelect({ id })
      handleClear()
    },
    [onSelect, handleClear],
  )

  const handleFilterChange = useCallback(
    ({ selectedValues }: { selectedValues: string[] }) => {
      onFilterChange?.(selectedValues)
    },
    [onFilterChange],
  )

  const hasFilters = collectionSpecificOptions && collectionSpecificOptions.length > 0
  const hasActiveFilters = selectedFilters && selectedFilters.length > 0

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__controls`}>
        <HierarchySearchInput
          onChange={handleInputChange}
          onClear={handleClear}
          onSearch={handleSearch}
          placeholder={t('hierarchy:searchLabel', { label: collectionLabel })}
          value={inputValue}
        />
        {hasFilters && (
          <Popup
            buttonClassName={`${baseClass}__filter`}
            caret={false}
            horizontalAlign="right"
            render={() => (
              <PopupList.IconButtonGroup>
                {collectionSpecificOptions.map(({ label, value }) => {
                  const isActive = selectedFilters?.includes(value)
                  return (
                    <PopupList.Button
                      active={isActive}
                      icon={isActive ? <CheckIcon size={16} /> : undefined}
                      key={value}
                      onClick={() => {
                        const newSelectedValues = isActive
                          ? selectedFilters.filter((v) => v !== value)
                          : [...selectedFilters, value]
                        handleFilterChange({ selectedValues: newSelectedValues })
                      }}
                    >
                      {label}
                    </PopupList.Button>
                  )
                })}
              </PopupList.IconButtonGroup>
            )}
            renderButton={({ active, onClick, onKeyDown }) => (
              <Button
                aria-label={t('general:filter')}
                buttonStyle="ghost"
                className={`${baseClass}__filter`}
                extraButtonProps={{ onKeyDown }}
                icon={<FilterIcon hasBadgeCutout={hasActiveFilters} size={16} />}
                onClick={onClick}
                round
                selected={active}
              />
            )}
            verticalAlign="bottom"
          />
        )}
      </div>
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
