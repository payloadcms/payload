'use client'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

const CustomLabel = () => {
  const { path } = useFieldProps()
  return (
    <label className="custom-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}

export default CustomLabel
