'use client'

import type { OptionObject, UIField } from 'payload'

import { SelectInput, useField } from '@payloadcms/ui'
import { useEffect, useMemo } from 'react'

interface Props {
  field: UIField
  path: string
  required?: boolean
}

const selectOptions = [
  {
    label: 'Option 1',
    value: 'option-1',
  },
  {
    label: 'Option 2',
    value: 'option-2',
  },
]
export function CustomInput({ field, path, required = false }: Props) {
  const { setValue, value } = useField<string>({ path })

  const options = useMemo(() => {
    const internal: OptionObject[] = []

    internal.push(...selectOptions)

    return internal
  }, [])

  return (
    <div className="custom-select-input">
      <SelectInput
        label={field.label}
        name={field.name}
        onChange={(option) => {
          const selectedValue = (Array.isArray(option) ? option[0]?.value : option?.value) || ''
          setValue(selectedValue)
        }}
        options={options}
        path={path}
        required={required}
        value={value}
      />
      <button
        className="clear-value"
        onClick={(e) => {
          e.preventDefault()
          setValue('')
        }}
        type="button"
      >
        Click me to reset value
      </button>
    </div>
  )
}
