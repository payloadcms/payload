'use client'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { textarea } from 'payload/fields/validations'
import { getTranslation } from 'payload/utilities'
import { useConfig } from '../../../providers/Config'
import { useLocale } from '../../../providers/Locale'
import useField from '../../useField'
import { isFieldRTL } from '../shared'
import TextareaInput from './Input'
import './index.scss'

const Textarea: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      placeholder,
      readOnly,
      rows,
      rtl,
      style,
      width,
    } = {},
    label,
    localized,
    maxLength,
    minLength,
    path: pathFromProps,
    required,
    validate = textarea,
  } = props

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  const locale = useLocale()

  const { localization } = useConfig()
  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  })
  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, required, maxLength, minLength],
  )

  const { errorMessage, setValue, showError, value } = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  return (
    <TextareaInput
      Error={Error}
      Label={Label}
      afterInput={afterInput}
      beforeInput={beforeInput}
      className={className}
      description={description}
      errorMessage={errorMessage}
      label={label}
      name={name}
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
      value={value as string}
      width={width}
    />
  )
}
export default Textarea
