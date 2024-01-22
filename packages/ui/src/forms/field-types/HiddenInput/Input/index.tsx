'use client'
import React, { useEffect } from 'react'

import useField from '../../../useField'

export const HiddenInput: React.FC<{
  path: string
  value: unknown
  disableModifyingForm?: boolean
}> = (props) => {
  const { path, value: valueFromProps, disableModifyingForm } = props

  const { setValue, value } = useField({
    path,
  })

  useEffect(() => {
    if (valueFromProps !== undefined) {
      setValue(valueFromProps, disableModifyingForm)
    }
  }, [valueFromProps, setValue, disableModifyingForm])

  return (
    <input
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={setValue}
      type="hidden"
      value={(value as string) || ''}
    />
  )
}
