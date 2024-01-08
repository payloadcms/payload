'use client'
import React, { useCallback } from 'react'

import useField from '../../useField'
import './index.scss'
import { Validate } from 'payload/types'

export const PasswordInput: React.FC<{
  name: string
  autoComplete?: string
  disabled?: boolean
  path: string
  required?: boolean
  validate?: Validate
}> = (props) => {
  const { name, autoComplete, disabled, path: pathFromProps, required, validate } = props

  const path = pathFromProps || name

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { errorMessage, formProcessing, setValue, showError, value } = useField({
    path,
    validate: memoizedValidate,
  })

  return (
    <input
      autoComplete={autoComplete}
      disabled={formProcessing || disabled}
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={setValue}
      type="password"
      value={(value as string) || ''}
    />
  )
}
