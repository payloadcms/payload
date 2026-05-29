'use client'
import type { NumberFieldClientComponent, NumberFieldClientProps } from 'payload'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { NumberInputProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { NumberInput } from './Input.js'
import './index.css'

export { NumberInput, type NumberInputProps }

const NumberFieldComponent: NumberFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, placeholder, step = 1 } = {},
      hasMany = false,
      label,
      localized,
      max = Infinity,
      maxRows = Infinity,
      min = -Infinity,
      required,
    },
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, max, min, required })
      }
    },
    [validate, min, max, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField<number | number[]>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value)
      let newVal = val

      if (Number.isNaN(val)) {
        newVal = null
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newVal)
      }

      setValue(newVal)
    },
    [onChangeFromProps, setValue],
  )

  const handleStep = useCallback(
    (direction: 'down' | 'up') => {
      if (readOnly || disabled) {
        return
      }
      const currentValue = typeof value === 'number' ? value : 0
      let newValue = direction === 'up' ? currentValue + step : currentValue - step

      // Clamp to min/max bounds
      if (newValue > max) {
        newValue = max
      }
      if (newValue < min) {
        newValue = min
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newValue)
      }

      setValue(newValue)
    },
    [disabled, max, min, onChangeFromProps, readOnly, setValue, step, value],
  )

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: number } }[]
  >([]) // Only for hasMany

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!(readOnly || disabled)) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
        }

        setValue(newValue)
      }
    },
    [readOnly, disabled, setValue],
  )

  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as unknown as Record<string, number>)?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          }
        }),
      )
    }
  }, [value, hasMany])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <NumberInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      description={description}
      Error={Error}
      hasMany={hasMany}
      Label={Label}
      label={label}
      localized={localized}
      max={max}
      maxRows={maxRows}
      min={min}
      onChange={hasMany ? handleHasManyChange : handleChange}
      onStep={handleStep}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly || disabled}
      required={required}
      showError={showError}
      step={step}
      style={styles}
      value={value as number}
      valueToRender={valueToRender}
    />
  )
}

export const NumberField = withCondition(NumberFieldComponent)
