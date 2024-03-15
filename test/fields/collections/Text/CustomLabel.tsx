'use client'

import { useFieldPath } from '@payloadcms/ui'
import React from 'react'

const CustomLabel = () => {
  const { path } = useFieldPath()
  return (
    <label className="custom-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}

export default CustomLabel
