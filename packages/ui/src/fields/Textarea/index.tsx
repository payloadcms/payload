'use client'
import type { ClientValidate, TextareaFieldProps } from 'payload'

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
    name,
    admin: {
      className,
      components: { Description, Error, Label, afterInput, beforeInput },
      description,
      placeholder,
      rtl,
      style,
      width,
    },
    label,
    locale,
    localized,
    maxLength,
    minLength,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    rows,
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

  const memoizedValidate: ClientValidate = useCallback(
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
      Description={Description}
      Error={Error}
      Label={Label}
      afterInput={afterInput}
      beforeInput={beforeInput}
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
