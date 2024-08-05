'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import { formatDate } from '../../../../../utilities/formatDate.js'

export const DateCell: React.FC<DefaultCellComponentProps<Date | number | string>> = ({
  cellData,
  clientFieldConfig: {
    admin: { dateFormat },
  },
}) => {
  const { i18n } = useTranslation()

  return <span>{cellData && formatDate({ date: cellData, i18n, pattern: dateFormat })}</span>
}
