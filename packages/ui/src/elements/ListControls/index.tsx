'use client'

import { useWindowInfo } from '@faceless-ui/window-info'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import type { ListControlsProps } from './types.js'

import { Popup, PopupList } from '../../elements/Popup/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { Dots } from '../../icons/Dots/index.js'
import { useListQuery } from '../../providers/ListQuery/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { ColumnsButton } from '../ColumnsButton/index.js'
import { GroupByControl } from '../GroupByControl/index.js'
import { QueryPresetBar } from '../QueryPresets/QueryPresetBar/index.js'
import { ListSearchFilter } from '../Search/ListSearchFilter/index.js'
import { WhereBuilder } from '../WhereBuilder/index.js'
import './index.css'

const baseClass = 'list-controls'

/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
export const ListControls: React.FC<ListControlsProps> = (props) => {
  const {
    beforeActions,
    collectionConfig,
    collectionSlug,
    disableQueryPresets,
    enableColumns = true,
    enableFilters = true,
    enableSort = false,
    hasCreatePermission,
    isWhereOpen: isWhereOpenFromProps,
    listMenuItems,
    newDocumentURL,
    onWhereToggle,
    queryPreset: activePreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
  } = props

  const isControlled = typeof onWhereToggle === 'function'

  const { handleSearchChange, hasActiveFilters, query } = useListQuery()

  const { t } = useTranslation()

  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  // Simplified placeholder - just "Search" instead of "Search by X, Y, Z"
  const searchLabelTranslated = t('general:searchBy', { label: '' }).split(' ')[0]

  const hasWhereParam = useRef(Boolean(query?.where))

  const [visibleDrawer, setVisibleDrawer] = useState<'columns' | 'sort' | 'where'>(
    hasActiveFilters ? 'where' : undefined,
  )

  useEffect(() => {
    if (hasWhereParam.current && !query?.where) {
      hasWhereParam.current = false
    } else if (query?.where) {
      hasWhereParam.current = true
    }
  }, [setVisibleDrawer, query?.where])

  const isWhereOpen = isControlled ? Boolean(isWhereOpenFromProps) : visibleDrawer === 'where'
  const handleWhereToggle = isControlled
    ? onWhereToggle
    : () => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__search-row`}>
        <div className={`${baseClass}__left`}>
          <ListSearchFilter
            key={collectionSlug}
            label={searchLabelTranslated}
            onSearchChange={handleSearchChange}
            searchQueryParam={query?.search}
          />
          {collectionConfig?.enableQueryPresets && !disableQueryPresets && (
            <QueryPresetBar
              activePreset={activePreset}
              collectionSlug={collectionSlug}
              queryPresetPermissions={queryPresetPermissions}
            />
          )}
        </div>
        <div className={`${baseClass}__spacer`} />
        <div className={`${baseClass}__actions`}>
          {!smallBreak && beforeActions}
          {enableFilters && (
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__toggle-where`}
              extraButtonProps={{
                'aria-controls': `${baseClass}-where`,
                'aria-expanded': visibleDrawer === 'where',
              }}
              icon={<ChevronIcon direction={isWhereOpen ? 'up' : 'down'} size={16} />}
              id="toggle-list-filters"
              onClick={handleWhereToggle}
              selected={isWhereOpen || hasActiveFilters}
              size="medium"
            >
              {t('general:filters')}
            </Button>
          )}
          <GroupByControl collectionSlug={collectionConfig.slug} fields={collectionConfig.fields} />
          {enableColumns && <ColumnsButton collectionSlug={collectionConfig.slug} />}
          {enableSort && (
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__toggle-sort`}
              extraButtonProps={{
                'aria-controls': `${baseClass}-sort`,
                'aria-expanded': visibleDrawer === 'sort',
              }}
              icon={<ChevronIcon size={16} />}
              id="toggle-list-sort"
              onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
              size="medium"
            >
              {t('general:sort')}
            </Button>
          )}
          {hasCreatePermission && newDocumentURL && (
            <Button
              buttonStyle="primary"
              className={`${baseClass}__create-new`}
              el="link"
              id="create-new-doc"
              size="medium"
              to={newDocumentURL}
            >
              {t('general:createNew')}
            </Button>
          )}
          {listMenuItems && Array.isArray(listMenuItems) && listMenuItems.length > 0 && (
            <Popup
              button={<Dots ariaLabel={t('general:moreOptions')} />}
              className={`${baseClass}__popup`}
              horizontalAlign="right"
              id="list-menu"
              size="medium"
              verticalAlign="bottom"
            >
              <PopupList.ButtonGroup>
                {listMenuItems.map((item, i) => (
                  <Fragment key={`list-menu-item-${i}`}>{item}</Fragment>
                ))}
              </PopupList.ButtonGroup>
            </Popup>
          )}
        </div>
      </div>
      {!isControlled && isWhereOpen && (
        <div className={`${baseClass}__where`} id={`${baseClass}-where`}>
          <WhereBuilder
            collectionPluralLabel={collectionConfig?.labels?.plural}
            collectionSlug={collectionConfig.slug}
            fields={collectionConfig?.fields}
            onClose={() => setVisibleDrawer(undefined)}
            renderedFilters={renderedFilters}
            resolvedFilterOptions={resolvedFilterOptions}
          />
        </div>
      )}
    </div>
  )
}
