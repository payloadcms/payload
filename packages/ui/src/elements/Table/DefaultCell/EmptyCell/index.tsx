'use client'
import React from 'react'

import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

export const EmptyCell: React.FC = () => {
  const { t } = useTranslation()

  return (
    <span className="empty-cell">
      <span aria-hidden="true">—</span>
      <span className="sr-only">{t('general:noValue')}</span>
    </span>
  )
}
