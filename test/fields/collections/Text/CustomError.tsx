'use client'

import React from 'react'

import { useFormFields, useFormSubmitted } from '@payloadcms/ui'
import { useField } from '@payloadcms/ui'

const CustomError: React.FC<any> = (props) => {
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

export default CustomError
