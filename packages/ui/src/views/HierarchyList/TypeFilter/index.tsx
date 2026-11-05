'use client'

import type { I18nClient } from '@payloadcms/translations'

import React, { useCallback } from 'react'

import { FilterTrigger } from '../../../elements/FilterTrigger/index.js'
import { Popup, PopupList } from '../../../elements/Popup/index.js'

const baseClass = 'type-filter'

type TypeFilterProps = {
  i18n: I18nClient
  onChange: (selectedValues: string[]) => void
  options: { label: string; value: string }[]
  selectedValues: string[]
}

export function TypeFilter({ i18n, onChange, options, selectedValues }: TypeFilterProps) {
  const isRefined = selectedValues.length !== options.length

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(options.map((o) => o.value))
    },
    [onChange, options],
  )

  if (options.length === 0) {
    return null
  }

  return (
    <Popup
      className={baseClass}
      horizontalAlign="left"
      popupType="menu"
      render={() => (
        <PopupList.CheckboxGroup>
          {options.map(({ label, value }) => {
            const isActive = selectedValues?.includes(value)
            return (
              <PopupList.CheckboxGroupItem
                active={isActive}
                key={value}
                onClick={() => {
                  const newSelectedValues = isActive
                    ? selectedValues.filter((v) => v !== value)
                    : [...selectedValues, value]
                  onChange(newSelectedValues)
                }}
              >
                {label}
              </PopupList.CheckboxGroupItem>
            )
          })}
        </PopupList.CheckboxGroup>
      )}
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <FilterTrigger
          {...ariaProps}
          isActive={isRefined}
          onClear={handleClear}
          onClick={onClick}
          onKeyDown={onKeyDown}
          popupActive={active}
        >
          {i18n.t('version:type')}
        </FilterTrigger>
      )}
      verticalAlign="bottom"
    />
  )
}
