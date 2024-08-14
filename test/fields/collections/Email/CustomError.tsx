'use client'

import { useField, useFormFields, useFormSubmitted } from '@payloadcms/ui'
import React from 'react'

export const CustomError: React.FC<any> = (props) => {
  const { path: pathFromProps } = props
  const submitted = useFormSubmitted()
  const { path } = useField(pathFromProps)
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)
  const { valid } = field || {}

  const showError = submitted && !valid

  if (showError) {
    return <div className="custom-error">#custom-error</div>
  }

  return null
}
