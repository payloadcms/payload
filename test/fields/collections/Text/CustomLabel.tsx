'use client'

import React from 'react'

import { useFieldProps } from '../../../../packages/ui/src/forms/FieldPropsProvider/index.js'

const CustomLabel = () => {
  const { path } = useFieldProps()
  return (
    <label className="custom-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}

export default CustomLabel
