'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'
import { isNumber } from 'payload/utilities'
import ReactSelect from '../../../elements/ReactSelect'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../providers/Translation'
import useField from '../../useField'
import { Option } from '../../../elements/ReactSelect/types'
import LabelComp from '../../Label'

import './index.scss'

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    className,
    placeholder,
    readOnly,
    style,
    width,
    path: pathFromProps,
    required,
    Error,
    Label: LabelFromProps,
    Description,
    BeforeInput,
    AfterInput,
    validate,
    label,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const max = 'max' in props ? props.max : Infinity
  const min = 'min' in props ? props.min : -Infinity
  const step = 'step' in props ? props.step : 1
  const hasMany = 'hasMany' in props ? props.hasMany : false
  const maxRows = 'maxRows' in props ? props.maxRows : Infinity

  const { i18n } = useTranslation()

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, max, min, required })
      }
    },
    [validate, min, max, required],
  )

  const { setValue, showError, value, path } = useField<number | number[]>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value)

      if (Number.isNaN(val)) {
        setValue('')
      } else {
        setValue(val)
      }
    },
    [setValue],
  )

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
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
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
              toString: () => `${val}${index}`,
              value: (val as any)?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
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
          filterOption={(option, rawInput) => {
            // eslint-disable-next-line no-restricted-globals
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            return isNumber(rawInput) && !isOverHasMany
          }}
          isClearable
          isCreatable
          isMulti
          isSortable
          // noOptionsMessage={({ inputValue }) => {
          //   const isOverHasMany = Array.isArray(value) && value.length >= maxRows
          //   if (isOverHasMany) {
          //     return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
          //   }
          //   return t('general:noOptions')
          // }}
          // numberOnly
          // onChange={handleHasManyChange}
          options={[]}
          // placeholder={t('general:enterAValue')}
          showError={showError}
          value={valueToRender as Option[]}
        />
      ) : (
        <div>
          {BeforeInput}
          <input
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={handleChange}
            onWheel={(e) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              e.target.blur()
            }}
            placeholder={getTranslation(placeholder, i18n)}
            step={step}
            type="number"
            value={typeof value === 'number' ? value : ''}
          />
          {AfterInput}
        </div>
      )}
      {Description}
    </div>
  )
}

export default withCondition(NumberField)
