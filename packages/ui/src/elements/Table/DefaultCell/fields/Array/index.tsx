'use client'
import type { CellComponentProps, DefaultCellComponentProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'

export interface ArrayCellProps extends DefaultCellComponentProps<Record<string, unknown>[]> {
  labels: CellComponentProps['labels']
}

export const ArrayCell: React.FC<ArrayCellProps> = ({ cellData, labels }) => {
  const { i18n } = useTranslation()

  const arrayFields = cellData ?? []

  const label =
    arrayFields.length === 1
      ? `${arrayFields.length} ${getTranslation(labels?.singular || i18n.t('general:rows'), i18n)}`
      : `${arrayFields.length} ${getTranslation(labels?.plural || i18n.t('general:rows'), i18n)}`

  return <span>{label}</span>
}
