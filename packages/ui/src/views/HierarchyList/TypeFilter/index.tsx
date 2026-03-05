'use client'

import type { I18nClient } from '@payloadcms/translations'

import React from 'react'

import { Button } from '../../../elements/Button/index.js'
import { CheckboxPopup } from '../../../elements/CheckboxPopup/index.js'
import './index.scss'

const baseClass = 'type-filter'

type TypeFilterProps = {
  i18n: I18nClient
  onChange: (selectedValues: string[]) => void
  options: { label: string; value: string }[]
  selectedValues: string[]
}

export function TypeFilter({ i18n, onChange, options, selectedValues }: TypeFilterProps) {
  const isRefined = selectedValues.length !== options.length ? true : false

  return (
    <CheckboxPopup
      Button={
        <Button
          buttonStyle="pill"
          className={`${baseClass}__button`}
          el="div"
          icon="chevron"
          margin={false}
          size="small"
        >
          {isRefined && <span className={`${baseClass}__count`}>{selectedValues.length}</span>}
          {i18n.t('version:type')}
        </Button>
      }
      className={[baseClass, isRefined ? `${baseClass}--active` : ''].filter(Boolean).join(' ')}
      onChange={({ selectedValues: newValues }) => onChange(newValues)}
      options={options}
      selectedValues={selectedValues}
    />
  )
}
