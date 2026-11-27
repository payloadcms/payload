'use client'
import React from 'react'

import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

export const EmptyCell: React.FC<{ label: string }> = ({ label }) => {
  const { t } = useTranslation()
  const screenReaderLabel = t('general:noLabel', { label }).replace(/^<(.*)>$/s, '$1')

  return (
    <span className="empty-cell">
      <span aria-hidden="true">—</span>
      <span className="sr-only">{screenReaderLabel}</span>
    </span>
  )
}
