'use client'

import type { SelectFieldClient } from '@ruya.sa/payload'

import { FieldLabel, ReactSelect, useField, useForm } from '@ruya.sa/ui'
import { useCallback, useId, useMemo } from 'react'

type Props = {
  field: Omit<SelectFieldClient, 'type'>
  label: string
  options: { label: string; value: number | string }[]
  path: string
}

export const OptionsSelect: React.FC<Props> = (props) => {
  const {
    field: { required },
    label,
    options: optionsFromProps,
    path,
  } = props

  const { setValue, value } = useField<(number | string)[]>({ path })
  const id = useId()

  const selectedValue = useMemo(() => {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return undefined
    }
    const foundOption = optionsFromProps.find((option) => {
      return value.find((item) => item === option.value)
    })

    return foundOption
  }, [optionsFromProps, value])

  const handleChange = useCallback(
    // @ts-expect-error - TODO: Fix types
    (option) => {
      if (selectedValue) {
        let selectedValueIndex = -1

        const valuesWithoutSelected = [...value].filter((o, index) => {
          if (o === selectedValue.value) {
            selectedValueIndex = index
            return false
          }

          return true
        })

        const newValues = [...valuesWithoutSelected]

        newValues.splice(selectedValueIndex, 0, option.value)

        setValue(newValues)
      } else {
        const values = [...(value || []), option.value]

        setValue(values)
      }
    },
    [selectedValue, setValue, value],
  )

  return (
    <div className="variantOptionsSelectorItem">
      <FieldLabel htmlFor={id} label={label} required={required} />

      <ReactSelect
        inputId={id}
        onChange={handleChange}
        options={optionsFromProps}
        value={selectedValue}
      />
    </div>
  )
}
