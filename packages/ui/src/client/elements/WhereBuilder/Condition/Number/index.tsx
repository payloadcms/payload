'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { NumberFilterProps as Props } from './types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'

export const NumberFilter: React.FC<Props> = (props) => {
  const {
    disabled,
    field: { admin, hasMany, label },
    onChange,
    operator,
    value,
  } = props

  const { i18n, t } = useTranslation()

  const ariaLabel = label ? getTranslation(label, i18n) : t('general:enterAValue')

  const isMulti = ['in', 'not_in'].includes(operator) || hasMany

  const [valueToRender, setValueToRender] = React.useState<
    { id: string; label: string; value: { value: number } }[]
  >([])

  const onSelect = React.useCallback(
    (selectedOption) => {
      let newValue
      if (!selectedOption) {
        newValue = []
      } else if (isMulti) {
        if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
        }
      }

      onChange(newValue)
    },
    [isMulti, onChange],
  )

  React.useEffect(() => {
    if (Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as any)?.value || val,
            },
          }
        }),
      )
    } else {
      setValueToRender([])
    }
  }, [value])

  const placeholder = getTranslation(admin?.placeholder, i18n) || t('general:enterAValue')

  return isMulti ? (
    <ReactSelect
      aria-label={ariaLabel}
      disabled={disabled}
      isClearable
      isCreatable
      isMulti={isMulti}
      isSortable
      numberOnly
      onChange={onSelect}
      options={[]}
      placeholder={placeholder}
      value={valueToRender || []}
    />
  ) : (
    <input
      aria-label={ariaLabel}
      className="form-input"
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type="number"
      value={value as number}
    />
  )
}
