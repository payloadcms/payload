'use client'

import type { Option, SelectFieldClientComponent } from 'payload'

import { SelectField, useField } from '@payloadcms/ui'
import React from 'react'

export const CustomMultiSelect: SelectFieldClientComponent = (props) => {
  const { path } = props
  const { setValue, value } = useField<string[]>({ path })
  const [options, setOptions] = React.useState<Option[]>([])

  React.useEffect(() => {
    const fetchOptions = () => {
      const fetched: Option[] = [
        { label: 'Label 1', value: 'value1' },
        { label: 'Label 2', value: 'value2' },
      ]
      setOptions(fetched)
    }
    void fetchOptions()
  }, [])

  const onChange = (val: string | string[]) => {
    setValue(Array.isArray(val) ? val : val ? [val] : [])
  }

  return (
    <SelectField
      {...props}
      field={{
        ...props.field,
        name: path,
        hasMany: true,
        options,
      }}
      onChange={onChange}
      value={value ?? []}
    />
  )
}
