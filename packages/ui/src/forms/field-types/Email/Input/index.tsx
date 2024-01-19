'use client'
import React, { useCallback } from 'react'
import { getTranslation } from '@payloadcms/translations'

import useField from '../../../useField'
import { useTranslation } from '../../../../providers/Translation'
import { Validate } from 'payload/types'

export const EmailInput: React.FC<{
  name: string
  autoComplete?: string
  readOnly?: boolean
  path: string
  required?: boolean
  placeholder?: Record<string, string> | string
  validate?: Validate
}> = (props) => {
  const {
    name,
    autoComplete,
    readOnly,
    path: pathFromProps,
    required,
    validate,
    placeholder,
  } = props

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const {
    // errorMessage,
    setValue,
    // showError,
    value,
  } = useField({
    path,
    validate: memoizedValidate,
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
