'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

import './index.scss'

export const CheckboxCell: React.FC<DefaultCellComponentProps<boolean>> = ({ cellData }) => {
  const { t } = useTranslation()
  return (
    <code className="bool-cell">
      <span>{t(`general:${cellData}`).toLowerCase()}</span>
    </code>
  )
}
