'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedConfig } from 'payload/types'

import { getTranslation } from 'payload/utilities'
import { isFieldRTL } from '../shared'
import './index.scss'
import useField from '../../useField'
import { useLocale } from '../../../providers/Locale'

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
}> = (props) => {
  const {
    path,
    placeholder,
    readOnly,
    localized,
    localizationConfig,
    rtl,
    // maxLength,
    // minLength,
  } = props

  const { i18n } = useTranslation()
  const locale = useLocale()

  const {
    // errorMessage,
    setValue,
    // showError,
    value,
  } = useField({
    path,
    // validate: memoizedValidate,
  })

  // const memoizedValidate = useCallback(
  //   (value, options) => {
  //     return validate(value, { ...options, maxLength, minLength, required })
  //   },
  //   [validate, minLength, maxLength, required],
  // )

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
      // onKeyDown={onKeyDown}
      placeholder={getTranslation(placeholder, i18n)}
      // ref={inputRef}
      type="text"
      value={(value as string) || ''}
    />
  )
}
