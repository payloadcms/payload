'use client'
import type { CheckboxFieldClient, DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import './index.scss'

export const CheckboxCell: React.FC<DefaultCellComponentProps<CheckboxFieldClient>> = ({
  cellData,
}) => {
  const { t } = useTranslation()

  return (
    <code className="bool-cell">
      <span>{t(`general:${cellData}`).toLowerCase()}</span>
    </code>
  )
}
