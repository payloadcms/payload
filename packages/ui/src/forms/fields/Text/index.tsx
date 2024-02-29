'use client'
import type { ClientValidate } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useState } from 'react'

import type { Option } from '../../../elements/ReactSelect/types'
import type { Props } from './types'

import ReactSelect from '../../../elements/ReactSelect'
import { useConfig } from '../../../providers/Config'
import { useLocale } from '../../../providers/Locale'
import { useTranslation } from '../../../providers/Translation'
import LabelComp from '../../Label'
import useField from '../../useField'
import { withCondition } from '../../withCondition'
import { fieldBaseClass, isFieldRTL } from '../shared'
import './index.scss'

const Text: React.FC<Props> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    hasMany,
    inputRef,
    label,
    localized,
    maxLength,
    maxRows,
    minLength,
    minRows,
    onKeyDown,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    rtl,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { i18n, t } = useTranslation()

  const locale = useLocale()

  const { localization: localizationConfig } = useConfig()

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, minLength, maxLength, required],
  )

  const { path, schemaPath, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
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
    <div
      className={[
        fieldBaseClass,
        'number',
        className,
        showError && 'error',
        readOnly && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {Error}
      {Label}
      {hasMany ? (
        <ReactSelect
          className={`field-${path.replace(/\./g, '__')}`}
          disabled={readOnly}
          // prevent adding additional options if maxRows is reached
          filterOption={() =>
            !maxRows ? true : !(Array.isArray(value) && maxRows && value.length >= maxRows)
          }
          isClearable
          isCreatable
          isMulti
          isSortable
          noOptionsMessage={() => {
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            if (isOverHasMany) {
              return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
            }
            return null
          }}
          onChange={handleHasManyChange}
          options={[]}
          placeholder={t('general:enterAValue')}
          showError={showError}
          value={valueToRender as Option[]}
        />
      ) : (
        <div>
          {BeforeInput}
          <input
            data-rtl={renderRTL}
            disabled={readOnly}
            id={`field-${path?.replace(/\./g, '__')}`}
            name={path}
            onChange={(e) => {
              setValue(e.target.value)
            }}
            onKeyDown={onKeyDown}
            placeholder={getTranslation(placeholder, i18n)}
            ref={inputRef}
            type="text"
            value={(value as string) || ''}
          />
          {AfterInput}
        </div>
      )}
      {Description}
    </div>
  )
}

export default withCondition(Text)
