'use client'

import type { EmailFieldClientComponent } from 'payload'

import React from 'react'

export const CustomLabel: EmailFieldClientComponent = ({
  field: { _path: pathFromProps, _schemaPath },
}) => {
  const path = pathFromProps ?? _schemaPath // pathFromContext will be undefined in list view

  return (
    <label className="custom-label" htmlFor={`field-${path?.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}
