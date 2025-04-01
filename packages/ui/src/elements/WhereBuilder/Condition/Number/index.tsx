'use client'
import React from 'react'

import type { Props } from './types.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'condition-value-number'

export const NumberFilter: React.FC<Props> = ({ disabled, onChange, value }) => {
  const { t } = useTranslation()

  return (
    <input
      className={baseClass}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('general:enterAValue')}
      type="number"
      value={value}
    />
  )
}
