'use client'

import React from 'react'

import { useFormFields, useFormSubmitted } from '../../../../packages/ui/src/forms/Form/context.js'
import { useField } from '../../../../packages/ui/src/forms/useField/index.js'

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
