/* eslint-disable react/destructuring-assignment */
'use client'
import type { ClientValidate, FieldBase, Option, OptionObject } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useState } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { Label as LabelComp } from '../../forms/Label/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type SelectFieldProps = FormFieldBase & {
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  label?: FieldBase['label']
  name?: string
  onChange?: (e: string) => void
  options?: Option[]
  path?: string
  value?: string
  width?: string
}

const formatOptions = (options: Option[]): OptionObject[] =>
  options.map((option) => {
    if (typeof option === 'object' && (option.value || option.value === '')) {
      return option
    }

    return {
      label: option,
      value: option,
    } as OptionObject
  })

export const SelectField: React.FC<SelectFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    label,
    onChange: onChangeFromProps,
    options: optionsFromProps = [],
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { i18n } = useTranslation()

  const [options] = useState(formatOptions(optionsFromProps))

  const memoizedValidate: ClientValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required, hasMany, options],
  )

  const { path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

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

  const onChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
        let newValue
        if (!selectedOption) {
          newValue = null
        } else if (hasMany) {
          if (Array.isArray(selectedOption)) {
            newValue = selectedOption.map((option) => option.value)
          } else {
            newValue = []
          }
        } else {
          newValue = selectedOption.value
        }

        if (typeof onChangeFromProps === 'function') {
          onChangeFromProps(newValue)
        }

        setValue(newValue)
      }
    },
    [readOnly, hasMany, setValue, onChangeFromProps],
  )

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
      {Error}
      {Label}
      <div>
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

export const Select = withCondition(SelectField)
