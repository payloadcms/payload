'use client'
import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { formatDate } from '../../../../../utilities/formatDate.js'

export const DateCell: React.FC<DefaultCellComponentProps<Date | number | string>> = ({
  cellData,
  dateDisplayFormat,
}) => {
  const {
    config: {
      admin: { dateFormat: dateFormatFromConfig },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  const dateFormat = dateDisplayFormat || dateFormatFromConfig

  return <span>{cellData && formatDate({ date: cellData, i18n, pattern: dateFormat })}</span>
}
