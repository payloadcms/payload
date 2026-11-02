'use client'
import type { DefaultCellComponentProps, JSONFieldClient } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.css'
import { stringifyTruncated } from '../../../../../utilities/stringifyTruncated.js'

export const JSONCell: React.FC<DefaultCellComponentProps<JSONFieldClient>> = ({ cellData }) => {
  const { t } = useTranslation()
  let cellDataString: string

  try {
    cellDataString = stringifyTruncated(cellData, 100)
  } catch (_ignore) {
    cellDataString = t('general:error')
  }

  return (
    <code className="json-cell">
      <span>{cellDataString}</span>
    </code>
  )
}
