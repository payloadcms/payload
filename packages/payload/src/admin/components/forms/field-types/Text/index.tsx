import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { text } from '../../../../../fields/validations'
import { useConfig } from '../../../utilities/Config'
import { useLocale } from '../../../utilities/Locale'
import useField from '../../useField'
import withCondition from '../../withCondition'
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
    hasMany,
    inputRef,
    label,
    localized,
    maxLength,
    maxRows,
    minLength,
    minRows,
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

  const handleOnChange = (e) => {
    setValue(e.target.value)
  }

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

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: string } }[]
  >([]) // Only for hasMany

  // useeffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: val?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          }
        }),
      )
    }
  }, [value, hasMany])

  return (
    <TextInput
      Error={Error}
      Label={Label}
      afterInput={afterInput}
      beforeInput={beforeInput}
      className={className}
      description={description}
      errorMessage={errorMessage}
      hasMany={hasMany}
      inputRef={inputRef}
      label={label}
      maxRows={maxRows}
      minRows={minRows}
      name={name}
      onChange={hasMany ? handleHasManyChange : handleOnChange}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      rtl={isRTL}
      showError={showError}
      style={style}
      value={value}
      valueToRender={valueToRender}
      width={width}
    />
  )
}

export default withCondition(Text)
