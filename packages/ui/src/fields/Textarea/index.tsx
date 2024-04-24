/* eslint-disable react/destructuring-assignment */
'use client'
import { getTranslation } from '@payloadcms/translations'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

import type { TextAreaInputProps, TextareaFieldProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isFieldRTL } from '../shared/index.js'
import { TextareaInput } from './Input.js'
import './index.scss'

export { TextAreaInputProps, TextareaFieldProps, TextareaInput }

const TextareaField: React.FC<TextareaFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    labelProps,
    locale,
    localized,
    path: pathFromProps,
    placeholder,
    readOnly: readOnlyFromProps,
    required,
    rows,
    rtl,
    style,
    validate,
    width,
  } = props

  const { i18n } = useTranslation()

  const { localization } = useConfig()

  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  })

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { path, setValue, showError, value } = useField<string>({
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  return (
    <TextareaInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      CustomDescription={CustomDescription}
      CustomError={CustomError}
      CustomLabel={CustomLabel}
      className={className}
      descriptionProps={descriptionProps}
      errorProps={errorProps}
      labelProps={labelProps}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      path={path}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={readOnly}
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

export const Textarea = withCondition(TextareaField)
