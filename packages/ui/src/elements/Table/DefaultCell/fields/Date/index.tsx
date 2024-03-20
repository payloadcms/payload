'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { formatDate } from '@payloadcms/ui/utilities/formatDate'
import React from 'react'

export interface DateCellProps extends CellComponentProps<string> {
  dateDisplayFormat?: CellProps['dateDisplayFormat']
}

export const DateCell: React.FC<DateCellProps> = ({ cellData, dateDisplayFormat }) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = useConfig()

  const { i18n } = useTranslation()

  const dateFormat = dateDisplayFormat || dateFormatFromConfig

  return <span>{cellData && formatDate(cellData, dateFormat, i18n.language)}</span>
}
