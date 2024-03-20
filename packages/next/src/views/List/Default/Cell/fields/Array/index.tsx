'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

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
