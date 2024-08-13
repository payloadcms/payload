'use client'

import type { Option } from 'payload'

import { SelectField, useField, useFieldProps } from '@payloadcms/ui'
import React from 'react'

export const CustomSelect = () => {
  const { path } = useFieldProps()
  const { setValue, value } = useField<string>({ path })
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([])

  React.useEffect(() => {
    const fetchOptions = () => {
      const fetchedOptions = [
        {
          label: 'Label 1',
          value: 'value1',
        },
        {
          label: 'Label 2',
          value: 'value2',
        },
      ]
      setOptions(fetchedOptions)
    }
    void fetchOptions()
  }, [])

  const onChange = (selected: Option | Option[]) => {
    const options = Array.isArray(selected) ? selected : [selected]
    setValue(options.map((option) => (typeof option === 'string' ? option : option.value)))
  }

  return (
    <div>
      <SelectField
        field={{
          name: path,
          hasMany: true,
          options,
        }}
        onChange={onChange}
        value={value}
      />
    </div>
  )
}
