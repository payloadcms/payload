'use client'
import type { TextareaFieldClientComponent, TextareaFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { TextAreaInputProps } from './types.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isFieldRTL } from '../shared/index.js'
import './index.scss'
import { TextareaInput } from './Input.js'

export { TextareaInput, TextAreaInputProps }

const TextareaFieldComponent: TextareaFieldClientComponent = (props) => {
  const {
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        placeholder,
        readOnly: readOnlyFromAdmin,
        rows,
        rtl,
        style,
        width,
      } = {},
      label,
      localized,
      maxLength,
      minLength,
      required,
    },
    labelProps,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { i18n } = useTranslation()
  const locale = useLocale()

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

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField<string>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <TextareaInput
      afterInput={field?.admin?.components?.afterInput}
      beforeInput={field?.admin?.components?.beforeInput}
      className={className}
      Description={field?.admin?.components?.Description}
      description={description}
      descriptionProps={descriptionProps}
      Error={field?.admin?.components?.Error}
      errorProps={errorProps}
      field={field}
      label={label}
      Label={field?.admin?.components?.Label}
      labelProps={labelProps}
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
