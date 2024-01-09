'use client'
import React, { useCallback } from 'react'
import { getTranslation } from '@payloadcms/translations'
import type { Props } from './types'

import { useTranslation } from '../../../providers/Translation'
import { useConfig } from '../../../providers/Config'
import { useLocale } from '../../../providers/Locale'
import useField from '../../useField'
import { isFieldRTL } from '../shared'
import TextareaInput from './Input'
import { Validate } from 'payload/types'

import './index.scss'

const Textarea: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
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
    validate,
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

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField({
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
