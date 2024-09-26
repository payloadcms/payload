'use client'
import type { OptionObject } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type SelectInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly BeforeInput?: React.ReactNode
  readonly className?: string
  readonly Description?: React.ReactNode
  readonly Error?: React.ReactNode
  readonly hasMany?: boolean
  readonly isClearable?: boolean
  readonly isSortable?: boolean
  readonly Label?: React.ReactNode
  readonly name: string
  readonly onChange?: ReactSelectAdapterProps['onChange']
  readonly options?: OptionObject[]
  readonly path: string
  readonly readOnly?: boolean
  readonly showError?: boolean
  readonly style?: React.CSSProperties
  readonly value?: string | string[]
  readonly width?: React.CSSProperties['width']
}

export const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    Error,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    Label,
    onChange,
    options,
    path,
    readOnly,
    showError,
    style,
    value,
    width,
  } = props

  const { i18n } = useTranslation()

  let valueToRender

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => {
      const matchingOption = options.find((option) => option.value === val)
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      }
    })
  } else if (value) {
    const matchingOption = options.find((option) => option.value === value)
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'select',
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      {Label}
      <div className={`${fieldBaseClass}__wrap`}>
        {Error}
        {BeforeInput}
        <ReactSelect
          disabled={readOnly}
          isClearable={isClearable}
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={onChange}
          options={options.map((option) => ({
            ...option,
            label: getTranslation(option.label, i18n),
          }))}
          showError={showError}
          value={valueToRender as OptionObject}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}
