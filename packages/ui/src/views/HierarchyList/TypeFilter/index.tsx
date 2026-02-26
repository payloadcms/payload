'use client'

import type { I18nClient } from '@payloadcms/translations'

import React from 'react'

import { CheckboxPopup } from '../../../elements/CheckboxPopup/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import { FilterIcon } from '../../../icons/Filter/index.js'

type TypeFilterProps = {
  i18n: I18nClient
  onChange: (selectedValues: string[]) => void
  options: { label: string; value: string }[]
  selectedValues: string[]
}

export function TypeFilter({ i18n, onChange, options, selectedValues }: TypeFilterProps) {
  const allSelected = selectedValues.length === options.length

  return (
    <CheckboxPopup
      Button={
        <Pill icon={<FilterIcon />} pillStyle={allSelected ? 'light' : 'dark'}>
          {i18n.t('general:filter')}
        </Pill>
      }
      onChange={({ selectedValues: newValues }) => onChange(newValues)}
      options={options}
      selectedValues={selectedValues}
    />
  )
}
