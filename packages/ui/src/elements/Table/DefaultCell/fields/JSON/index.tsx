'use client'
import type { DefaultCellComponentProps, JSONFieldClient } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.scss'
import { stringifyTruncated } from '../../../../../utilities/stringifyTruncated.js'

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({ cellData }) => {
  const { t } = useTranslation()
  try {
    const cellDataString = stringifyTruncated(cellData, 100)
    return (
      <code className="json-cell">
        <span>{cellDataString}</span>
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
