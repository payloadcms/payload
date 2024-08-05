'use client'
import type { DefaultCellComponentProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'

export interface ArrayCellProps extends DefaultCellComponentProps<Record<string, unknown>[]> {}

export const ArrayCell: React.FC<ArrayCellProps> = ({
  cellData,
  clientFieldConfig: { labels },
}) => {
  const { i18n } = useTranslation()

  const arrayFields = cellData ?? []

  const label = `${arrayFields.length} ${getTranslation(
    labels?.plural || i18n.t('general:rows'),
    i18n,
  )}`

  return <span>{label}</span>
}
