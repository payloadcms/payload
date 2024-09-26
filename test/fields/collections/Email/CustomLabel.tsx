'use client'

import type { EmailFieldClientComponent } from 'payload'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

export const CustomLabel: EmailFieldClientComponent = ({ field }) => {
  const { path: pathFromContext } = useFieldProps()

  const path = pathFromContext ?? field?._schemaPath // pathFromContext will be undefined in list view

  return (
    <label className="custom-label" htmlFor={`field-${path?.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}
