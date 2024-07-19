'use client'
import React from 'react'

import type { Props } from './types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import { buildReactSelectOptions, buildReactSelectValues } from '../../../../fields/Select/utils.js'

export const Select: React.FC<Props> = ({
  disabled,
  onChange,
  operator,
  options: optionsFromProps,
  value,
}) => {
  const { i18n } = useTranslation()
  const options = React.useMemo(
    () =>
      buildReactSelectOptions({
        options: optionsFromProps,
        i18n,
      }),
    [optionsFromProps],
  )

  const isMulti = ['in', 'not_in'].includes(operator)
  const values = buildReactSelectValues({
    options: optionsFromProps,
    values: typeof value === 'string' ? [value] : value,
    i18n,
  })

  const onSelect = React.useCallback(
    (selectedOption) => {
      let newValue
      if (!selectedOption) {
        newValue = null
      } else if (isMulti) {
        if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value)
        } else {
          newValue = []
        }
      } else {
        newValue = selectedOption.value
      }

      onChange(newValue)
    },
    [isMulti, onChange],
  )

  React.useEffect(() => {
    if (!isMulti && Array.isArray(value)) {
      onChange(value[0])
    }
  }, [isMulti, onChange, value])

  return (
    <ReactSelect
      disabled={disabled}
      isMulti={isMulti}
      onChange={onSelect}
      options={options}
      value={values}
    />
  )
}
