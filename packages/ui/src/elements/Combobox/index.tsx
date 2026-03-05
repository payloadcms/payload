'use client'
import React, { useMemo, useRef, useState } from 'react'

import type { PopupProps } from '../Popup/index.js'

import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

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
  entries: ComboboxEntry[]
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
    entries,
    minEntriesForSearch = 8,
    onSelect,
    onToggleClose,
    onToggleOpen,
    searchPlaceholder = 'Search...',
    ...popupProps
  } = props
  const [searchValue, setSearchValue] = useState('')
  const isOpenRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredEntries = useMemo(() => {
    if (!searchValue) {
      return entries
    }
    const search = searchValue.toLowerCase()
    return entries.filter((entry) => entry.name.toLowerCase().includes(search))
  }, [entries, searchValue])

  const showSearch = entries.length >= minEntriesForSearch
  const hasResults = filteredEntries.length > 0

  const handleToggleOpen = React.useCallback(
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

  const handleToggleClose = React.useCallback(() => {
    isOpenRef.current = false
    setSearchValue('')
    onToggleClose?.()
  }, [onToggleClose])

  return (
    <Popup
      {...popupProps}
      className={`${baseClass} ${popupProps.className || ''}`}
      onToggleClose={handleToggleClose}
      onToggleOpen={handleToggleOpen}
      render={({ close }) => (
        <div className={`${baseClass}__content`}>
          {showSearch && (
            <div
              className={`${baseClass}__search-wrapper${!hasResults ? ` ${baseClass}__search-wrapper--no-results` : ''}`}
            >
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
          )}
          <PopupList.ButtonGroup>
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
          </PopupList.ButtonGroup>
        </div>
      )}
    />
  )
}
