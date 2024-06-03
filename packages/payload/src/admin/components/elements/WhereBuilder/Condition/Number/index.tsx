import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import './index.scss'

const baseClass = 'condition-value-number'

const NumberField: React.FC<Props> = ({ disabled, onChange, operator, value }) => {
  const { t } = useTranslation('general')

  const isMulti = ['in', 'not_in'].includes(operator)

  let valueToRender

  if (isMulti && Array.isArray(value)) {
    valueToRender = value.map((val) => ({ label: val, value: val }))
  } else if (value) {
    valueToRender = { label: value, value }
  }

  return (
    <input
      className={baseClass}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('enterAValue')}
      type="number"
      value={value}
    />
  )
}

export default NumberField
