'use client'

import type { LabelComponent } from 'payload'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

export const CustomLabel: LabelComponent<'text'> = ({ schemaPath }) => {
  const { path: pathFromContext } = useFieldProps()

  const path = pathFromContext ?? schemaPath // pathFromContext will be undefined in list view

  return (
    <label className="custom-label" htmlFor={`field-${path.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}
