'use client'
import type { TextareaFieldClientComponent, TextareaFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { TextAreaInputProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isFieldRTL } from '../shared/index.js'
import './index.scss'
import { TextareaInput } from './Input.js'

export { TextareaInput, TextAreaInputProps }

const TextareaFieldComponent: TextareaFieldClientComponent = (props) => {
  const {
    AfterInput,
    BeforeInput,
    Description,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: { className, placeholder, readOnly: readOnlyFromAdmin, rows, rtl, style, width } = {},
      label,
      localized,
      maxLength,
      minLength,
      required,
    },
    Label,
    locale,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { i18n } = useTranslation()

  const {
    config: { localization },
  } = useConfig()

  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  })

  const memoizedValidate: TextareaFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxLength, minLength, required })
      }
    },
    [validate, required, maxLength, minLength],
  )

  const path = pathFromProps ?? name

  const { formInitializing, formProcessing, setValue, showError, value } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

  return (
    <TextareaInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      Error={Error}
      Label={Label}
      label={label}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      path={path}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={disabled}
      required={required}
      rows={rows}
      rtl={isRTL}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  )
}

export const TextareaField = withCondition(TextareaFieldComponent)
