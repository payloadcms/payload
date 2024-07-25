'use client'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

const CustomLabel = ({ schemaPath }) => {
  const { path: pathFromContext } = useFieldProps()

  const path = pathFromContext ?? schemaPath // pathFromContext will be undefined in list view

  return (
    <label className="custom-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}

export default CustomLabel
