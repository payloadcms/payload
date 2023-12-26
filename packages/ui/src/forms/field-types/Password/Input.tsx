'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'

import { password } from 'payload/fields/validations'
import useField from '../../useField'
import './index.scss'

export const PasswordInput: React.FC<{
  name: string
  autoComplete?: string
  disabled?: boolean
  path: string
  required?: boolean
}> = (props) => {
  const {
    name,
    autoComplete,
    disabled,
    path: pathFromProps,
    // required,
  } = props

  const path = pathFromProps || name

  // const memoizedValidate = useCallback(
  //   (value, options) => {
  //     const validationResult = validate(value, { ...options, required })
  //     return validationResult
  //   },
  //   [validate, required],
  // )

  const { errorMessage, formProcessing, setValue, showError, value } = useField({
    path,
    // validate: memoizedValidate,
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
