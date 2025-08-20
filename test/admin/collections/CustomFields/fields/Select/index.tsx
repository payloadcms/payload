'use client'

import type { Option, SelectFieldClientComponent } from 'payload'

import { SelectField, useField } from '@payloadcms/ui'
import React from 'react'

export const CustomSelect: SelectFieldClientComponent = (props) => {
  const { path } = props
  const { setValue, value } = useField<string>({ path })
  const [options, setOptions] = React.useState<Option[]>([])

  React.useEffect(() => {
    const fetchOptions = () => {
      const fetchedOptions: Option[] = [
        { label: 'Label 1', value: 'value1' },
        { label: 'Label 2', value: 'value2' },
      ]
      setOptions(fetchedOptions)
    }
    void fetchOptions()
  }, [])

  const onChange = (val: string | string[]) => {
    setValue(Array.isArray(val) ? (val[0] ?? '') : val)
  }

  return (
    <div>
      <SelectField
        {...props}
        field={{
          ...props.field,
          options,
        }}
        onChange={onChange}
        value={value ?? ''}
      />
    </div>
  )
}
