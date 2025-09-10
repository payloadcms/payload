'use client'
import React from 'react'

import type { NumberFilterProps as Props } from './types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { ReactSelect } from '../../../ReactSelect/index.js'
import './index.scss'

const baseClass = 'condition-value-number'

export const NumberFilter: React.FC<Props> = (props) => {
  const {
    disabled,
    field: { hasMany },
    onChange,
    operator,
    value,
  } = props

  const { t } = useTranslation()

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

  return isMulti ? (
    <ReactSelect
      disabled={disabled}
      isClearable
      isCreatable
      isMulti={isMulti}
      isSortable
      numberOnly
      onChange={onSelect}
      options={[]}
      placeholder={t('general:enterAValue')}
      value={valueToRender || []}
    />
  ) : (
    <input
      className={baseClass}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('general:enterAValue')}
      type="number"
      value={value as number}
    />
  )
}
