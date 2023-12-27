import React, { useCallback } from 'react'

import type { Props } from './types'

import { text } from 'payload/fields/validations'
import { useConfig } from '../../../providers/Config'
import { useLocale } from '../../../providers/Locale'
import useField from '../../useField'
import { isFieldRTL } from '../shared'
import TextInput from './Input'

const Text: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      placeholder,
      readOnly,
      rtl,
      style,
      width,
    } = {},
    inputRef,
    label,
    localized,
    maxLength,
    minLength,
    path: pathFromProps,
    required,
    validate = text,
  } = props

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
    [validate, minLength, maxLength, required],
  )

  const { errorMessage, setValue, showError, value } = useField<string>({
    condition,
    path,
    validate: memoizedValidate,
  })

  return null
}

export default Text
