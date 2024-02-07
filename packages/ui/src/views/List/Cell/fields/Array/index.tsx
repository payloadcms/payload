'use client'
import React from 'react'

import { getTranslation } from '@payloadcms/translations'
import type { CellComponentProps, CellProps } from 'payload/types'
import { useTranslation } from '../../../../../providers/Translation'

export interface ArrayCellProps extends CellComponentProps<Record<string, unknown>[]> {
  labels: CellProps['labels']
}

export const ArrayCell: React.FC<ArrayCellProps> = ({ cellData, labels }) => {
  const { i18n } = useTranslation()

  const arrayFields = cellData ?? []

  const label = `${arrayFields.length} ${getTranslation(
    labels?.plural || i18n.t('general:rows'),
    i18n,
  )}`

  return <span>{label}</span>
}
