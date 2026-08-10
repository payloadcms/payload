'use client'
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { PopupProps } from '../Popup/index.js'

import { SearchIcon } from '../../icons/Search/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { matchesSearchQuery } from '../../utilities/matchesSearchQuery.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

const baseClass = 'combobox'

/**
 * @internal
 * @experimental
 */
export type ComboboxEntry = {
  Component: React.ReactNode
  name: string
}

/**
 * @internal
 * @experimental
 */
export type ComboboxProps = {
  /** Accessible label for the list of entries */
  'aria-label'?: string
  entries: ComboboxEntry[]
  /**
   * Pinned below the entries, outside the scroll area and unaffected by search.
   * For actions that belong to the list as a whole, such as "create new".
   */
  footer?: (args: { close: () => void }) => React.ReactNode
  /** Minimum number of entries required to show search */
  minEntriesForSearch?: number
  onSelect?: (entry: ComboboxEntry) => void
  searchPlaceholder?: string
} & Omit<PopupProps, 'children' | 'render'>

/**
 * A wrapper on top of Popup + PopupList.ButtonGroup that adds search functionality.
 *
 * @internal - this component may be removed or receive breaking changes in minor releases.
 * @experimental
 */
export const Combobox: React.FC<ComboboxProps> = (props) => {
  const {
    'aria-label': ariaLabel,
    entries,
    footer,
    minEntriesForSearch = 8,
    onSelect,
    onToggleClose,
    onToggleOpen,
    searchPlaceholder = 'Search...',
    ...popupProps
  } = props

  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const isOpenRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesSearchQuery({ label: entry.name, query: searchValue })),
    [entries, searchValue],
  )

  const showSearch = entries.length >= minEntriesForSearch
  const hasResults = filteredEntries.length > 0

  // Locking the width the moment searching begins keeps the popup from
  // resizing around the cursor as entries filter out from under it.
  const [lockedWidth, setLockedWidth] = useState<null | number>(null)

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    if (searchValue && lockedWidth === null) {
      setLockedWidth(contentRef.current.offsetWidth)
    } else if (!searchValue && lockedWidth !== null) {
      setLockedWidth(null)
    }
  }, [searchValue, lockedWidth])

  const handleToggleOpen = useCallback(
    (active: boolean) => {
      isOpenRef.current = active
      if (active && showSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
      }
      onToggleOpen?.(active)
    },
    [showSearch, onToggleOpen],
  )

  const handleToggleClose = useCallback(() => {
    isOpenRef.current = false
    setSearchValue('')
    setLockedWidth(null)
    onToggleClose?.()
  }, [onToggleClose])

  return (
    <Popup
      {...popupProps}
      className={`${baseClass} ${popupProps.className || ''}`}
      onToggleClose={handleToggleClose}
      onToggleOpen={handleToggleOpen}
      render={({ close }) => (
        <div
          className={`${baseClass}__content`}
          data-width-locked={lockedWidth ? 'true' : undefined}
          ref={contentRef}
          style={
            lockedWidth
              ? ({ '--combobox-locked-width': `${lockedWidth}px` } as React.CSSProperties)
              : undefined
          }
        >
          {showSearch && (
            <div className={`${baseClass}__search`}>
              <div className={`${baseClass}__search-bar`}>
                <SearchIcon size={24} />
                <input
                  aria-label={searchPlaceholder}
                  className={`${baseClass}__search-input`}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                />
              </div>
            </div>
          )}
          {hasResults ? (
            <PopupList.ButtonGroup className={`${baseClass}__entries`}>
              <div aria-label={ariaLabel} role="menu">
                {filteredEntries.map((entry, index) => {
                  const handleClick = () => {
                    if (onSelect) {
                      onSelect(entry)
                    }
                    close()
                  }

                  return (
                    <div
                      className={`${baseClass}__entry`}
                      data-popup-prevent-close
                      key={`${entry.name}-${index}`}
                      onClick={handleClick}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick()
                        }
                      }}
                      role="menuitem"
                      tabIndex={0}
                    >
                      {entry.Component}
                    </div>
                  )
                })}
              </div>
            </PopupList.ButtonGroup>
          ) : (
            <div className={`${baseClass}__no-results`}>{t('general:noMatchesFound')}</div>
          )}
          {footer && <div className={`${baseClass}__footer`}>{footer({ close })}</div>}
        </div>
      )}
    />
  )
}
