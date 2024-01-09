import React from 'react'
import { useTranslation } from '../../../../providers/Translation'

import type { Props } from './types'

import './index.scss'

const baseClass = 'condition-value-text'

const Text: React.FC<Props> = ({ disabled, onChange, value }) => {
  const { t } = useTranslation()
  return (
    <input
      className={baseClass}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('general:enterAValue')}
      type="text"
      value={value || ''}
    />
  )
}

export default Text
