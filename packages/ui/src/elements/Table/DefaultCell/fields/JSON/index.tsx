'use client'
import type { DefaultCellComponentProps, JSONFieldClient } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.scss'

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({ cellData }) => {
  const { t } = useTranslation()
  try {
    const cellDataString = JSON.stringify(cellData)
    const textToShow =
      cellDataString.length > 100 ? `${cellDataString.substring(0, 100)}\u2026` : cellDataString

    return (
      <code className="json-cell">
        <span>{textToShow}</span>
      </code>
    )
  } catch (_ignore) {
    return (
      <code className="json-cell">
        <span>{t('general:error')}</span>
      </code>
    )
  }
}
