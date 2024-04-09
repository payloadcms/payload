'use client'
import type { DefaultCellComponentProps } from 'payload/types'

import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { formatDate } from '@payloadcms/ui/utilities/formatDate'
import React from 'react'

export const DateCell: React.FC<DefaultCellComponentProps<Date | number | string>> = ({
  cellData,
  dateDisplayFormat,
}) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = useConfig()

  const { i18n } = useTranslation()

  const dateFormat = dateDisplayFormat || dateFormatFromConfig

  return <span>{cellData && formatDate({ date: cellData, i18n, pattern: dateFormat })}</span>
}
