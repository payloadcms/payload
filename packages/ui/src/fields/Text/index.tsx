'use client'
import type {} from 'payload/types'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React, { useCallback, useEffect, useState } from 'react'

import type { Option } from '../../elements/ReactSelect/types.js'
import type { TextFieldProps, TextInputProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { isFieldRTL } from '../shared/index.js'
import { TextInput } from './Input.js'
import './index.scss'

export { TextFieldProps, TextInput, TextInputProps }

const TextField: React.FC<TextFieldProps> = (props) => {
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
    hasMany,
    inputRef,
    labelProps,
    localized,
    maxRows,
    minRows,
    path: pathFromProps,
    placeholder,
    readOnly: readOnlyFromProps,
    required,
    rtl,
    style,
    validate,
    width,
  } = props

  const locale = useLocale()

  const { localization: localizationConfig } = useConfig()

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  const renderRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localizationConfig || undefined,
  })

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: number } }[]
  >([]) // Only for hasMany

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value?.value || option.value)
        } else {
          newValue = [selectedOption.value?.value || selectedOption.value]
        }

        setValue(newValue)
      }
    },
    [readOnly, setValue],
  )

  // useEffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              // React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
              toString: () => `${val}${index}`,
              value: val?.value || val,
            },
          }
        }),
      )
    }
  }, [value, hasMany])

  return (
    <TextInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      CustomDescription={CustomDescription}
      CustomError={CustomError}
      CustomLabel={CustomLabel}
      className={className}
      descriptionProps={descriptionProps}
      errorProps={errorProps}
      hasMany={hasMany}
      inputRef={inputRef}
      labelProps={labelProps}
      maxRows={maxRows}
      minRows={minRows}
      onChange={
        hasMany
          ? handleHasManyChange
          : (e) => {
              setValue(e.target.value)
            }
      }
      path={path}
      placeholder={placeholder}
      readOnly={formProcessing || readOnly}
      required={required}
      rtl={renderRTL}
      showError={showError}
      style={style}
      value={(value as string) || ''}
      valueToRender={valueToRender as Option[]}
      width={width}
    />
  )
}

export const Text = withCondition(TextField)
