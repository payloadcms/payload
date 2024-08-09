'use client'
import type { TextareaFieldProps, TextareaFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { TextAreaInputProps } from './types.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isFieldRTL } from '../shared/index.js'
import { TextareaInput } from './Input.js'
import './index.scss'

export { TextAreaInputProps, TextareaInput }

const TextareaFieldComponent: React.FC<TextareaFieldProps> = (props) => {
  const {
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        placeholder,
        readOnly: readOnlyFromProps,
        rows,
        rtl,
        style,
        width,
      },
      label,
      localized,
      maxLength,
      minLength,
      required,
    },
    locale,
    validate,
  } = props

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
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, required, maxLength, minLength],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField<string>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <TextareaInput
      Description={field?.admin?.components?.Description}
      Error={field?.admin?.components?.Error}
      Label={field?.admin?.components?.Label}
      afterInput={field?.admin?.components?.afterInput}
      beforeInput={field?.admin?.components?.beforeInput}
      className={className}
      description={description}
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
