'use client'

import React, { useCallback } from 'react'

import { useTranslation } from '../../../providers/Translation'
import type { OptionObject, Validate } from 'payload/types'
import type { Option } from '../../../elements/ReactSelect/types'
import { getTranslation } from '@payloadcms/translations'
import ReactSelect from '../../../elements/ReactSelect'
import useField from '../../useField'

import './index.scss'

const SelectInput: React.FC<{
  readOnly: boolean
  isClearable: boolean
  hasMany: boolean
  isSortable: boolean
  options: OptionObject[]
  path: string
  validate?: Validate
  required?: boolean
}> = ({ readOnly, isClearable, hasMany, isSortable, options, path, validate, required }) => {
  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField({
    path,
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

        setValue(newValue)
      }
    },
    [readOnly, hasMany, setValue],
  )

  return (
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
      value={valueToRender as Option}
    />
  )
}

export default SelectInput
