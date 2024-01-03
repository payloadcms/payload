'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'

import useField from '../../useField'
import './index.scss'
import { getTranslation } from 'payload/utilities'

export const EmailInput: React.FC<{
  name: string
  autoComplete?: string
  readOnly?: boolean
  path: string
  required?: boolean
  placeholder?: Record<string, string> | string
}> = (props) => {
  const {
    name,
    autoComplete,
    readOnly,
    path: pathFromProps,
    required,
    // validate = email,
    placeholder,
  } = props

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  // const memoizedValidate = useCallback(
  //   (value, options) => {
  //     return validate(value, { ...options, required })
  //   },
  //   [validate, required],
  // )

  const {
    // errorMessage,
    setValue,
    // showError,
    value,
  } = useField({
    path,
    // validate: memoizedValidate,
  })

  return (
    <input
      autoComplete={autoComplete}
      disabled={Boolean(readOnly)}
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={setValue}
      placeholder={getTranslation(placeholder, i18n)}
      type="email"
      value={(value as string) || ''}
    />
  )
}
