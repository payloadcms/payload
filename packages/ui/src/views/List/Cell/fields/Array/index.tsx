'use client'
import React from 'react'

import { getTranslation } from '@payloadcms/translations'
import type { CellComponentProps } from 'payload/types'
import { useTranslation } from '../../../../../providers/Translation'

export const ArrayCell: React.FC<CellComponentProps<Record<string, unknown>>> = ({
  data,
  field,
}) => {
  const { i18n } = useTranslation()

  const arrayFields = data ?? []
  const label = `${arrayFields.length} ${getTranslation(
    field?.labels?.plural || i18n.t('general:rows'),
    i18n,
  )}`

  return <span>{label}</span>
}
