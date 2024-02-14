'use client'
import React, { useCallback, useState } from 'react'

import type { Option, OptionObject, Validate } from 'payload/types'
import type { Props } from './types'
import { withCondition } from '../../withCondition'
import { getTranslation } from '@payloadcms/translations'
import { fieldBaseClass } from '../shared'
import useField from '../../useField'
import ReactSelect from '../../../elements/ReactSelect'
import { useTranslation } from '../../../providers/Translation'
import LabelComp from '../../Label'

import './index.scss'

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

export const Select: React.FC<Props> = (props) => {
  const {
    name,
    className,
    readOnly,
    style,
    width,
    path: pathFromProps,
    required,
    Description,
    Error,
    Label: LabelFromProps,
    label,
    BeforeInput,
    AfterInput,
    validate,
    onChange: onChangeFromProps,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const optionsFromProps = 'options' in props ? props.options : []
  const hasMany = 'hasMany' in props ? props.hasMany : false
  const isClearable = 'isClearable' in props ? props.isClearable : true
  const isSortable = 'isSortable' in props ? props.isSortable : true

  const { i18n } = useTranslation()

  const [options] = useState(formatOptions(optionsFromProps))

  const memoizedValidate: Validate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required],
  )

  const { setValue, value, showError, path } = useField({
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

export default withCondition(Select)
