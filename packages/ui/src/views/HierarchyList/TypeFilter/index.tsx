'use client'

import type { I18nClient } from '@payloadcms/translations'

import React, { useCallback } from 'react'

import { FilterTrigger } from '../../../elements/FilterTrigger/index.js'
import { Popup } from '../../../elements/Popup/index.js'
import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import './index.css'

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

  return (
    <Popup
      className={baseClass}
      horizontalAlign="right"
      render={() => (
        <div className={`${baseClass}__options`}>
          {options.map(({ label, value }) => (
            <CheckboxInput
              checked={selectedValues?.includes(value)}
              key={value}
              label={label}
              onToggle={() => {
                const newSelectedValues = selectedValues?.includes(value)
                  ? selectedValues.filter((v) => v !== value)
                  : [...selectedValues, value]
                onChange(newSelectedValues)
              }}
            />
          ))}
        </div>
      )}
      renderButton={({ active, onClick, onKeyDown }) => (
        <FilterTrigger
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
