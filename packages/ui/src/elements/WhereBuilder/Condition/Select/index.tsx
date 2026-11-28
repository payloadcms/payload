'use client'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { SelectFilterProps as Props } from './types.js'

import { useEffectEvent } from '../../../../hooks/useEffectEvent.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import { formatOptions } from './formatOptions.js'
import {
  isMultiValueOperator,
  resolveSelectFilterValue,
  shouldWriteSelectScalar,
} from './normalizeSelectValue.js'

export const Select: React.FC<Props> = ({
  disabled,
  field: {
    admin: { placeholder },
  },
  isClearable,
  onChange,
  operator,
  options: optionsFromProps,
  value: valueFromProps,
}) => {
  const { i18n } = useTranslation()
  const [options, setOptions] = React.useState(formatOptions(optionsFromProps))

  const isMulti = isMultiValueOperator(operator)
  const value = resolveSelectFilterValue(operator, valueFromProps)
  const lastWrittenRef = React.useRef<unknown>(undefined)

  let valueToRender

  if (isMulti && Array.isArray(value)) {
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

      lastWrittenRef.current = newValue
      onChange(newValue)
    },
    [isMulti, onChange],
  )

  React.useEffect(() => {
    setOptions(formatOptions(optionsFromProps))
  }, [optionsFromProps])

  // leftover array under a single-value op → write scalar once (avoids update-depth loop)
  const writeScalarIfNeeded = useEffectEvent(() => {
    const decision = shouldWriteSelectScalar(operator, valueFromProps, lastWrittenRef.current)
    if (decision.write) {
      lastWrittenRef.current = decision.next
      onChange(decision.next)
      return
    }
    if (isMulti || !Array.isArray(valueFromProps)) {
      lastWrittenRef.current = undefined
    }
  })

  React.useEffect(() => {
    writeScalarIfNeeded()
  }, [operator, valueFromProps])

  return (
    <ReactSelect
      disabled={disabled}
      isClearable={isClearable}
      isMulti={isMulti}
      onChange={onSelect}
      options={options.map((option) => ({ ...option, label: getTranslation(option.label, i18n) }))}
      placeholder={placeholder}
      value={valueToRender}
    />
  )
}
