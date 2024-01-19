'use client'

import React, { useCallback } from 'react'
import { getTranslation } from '@payloadcms/translations'
import type { SanitizedConfig, Validate } from 'payload/types'

import { useTranslation } from '../../../../providers/Translation'
import { isFieldRTL } from '../../shared'
import useField from '../../../useField'
import { useLocale } from '../../../../providers/Locale'

export const TextInput: React.FC<{
  name: string
  autoComplete?: string
  readOnly?: boolean
  path: string
  required?: boolean
  placeholder?: Record<string, string> | string
  localized?: boolean
  localizationConfig?: SanitizedConfig['localization']
  rtl?: boolean
  maxLength?: number
  minLength?: number
  validate?: Validate
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  inputRef?: React.MutableRefObject<HTMLInputElement>
}> = (props) => {
  const {
    path,
    placeholder,
    readOnly,
    localized,
    localizationConfig,
    rtl,
    maxLength,
    minLength,
    validate,
    required,
    onKeyDown,
    inputRef,
  } = props

  const { i18n } = useTranslation()
  const locale = useLocale()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, minLength, maxLength, required],
  )

  const { setValue, value } = useField({
    path,
    validate: memoizedValidate,
  })

  const renderRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localizationConfig || undefined,
  })

  return (
    <input
      data-rtl={renderRTL}
      disabled={readOnly}
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      onKeyDown={onKeyDown}
      placeholder={getTranslation(placeholder, i18n)}
      ref={inputRef}
      type="text"
      value={(value as string) || ''}
    />
  )
}
