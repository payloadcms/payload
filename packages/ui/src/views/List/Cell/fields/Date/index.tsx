'use client'
import type { CellComponentProps, CellProps } from 'payload/types'

import React from 'react'

import { useConfig } from '../../../../../providers/Config'
import { useTranslation } from '../../../../../providers/Translation'
import { formatDate } from '../../../../../utilities/formatDate'

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
