'use client'
import type { DateFieldClient, DefaultCellComponentProps } from 'payload'

import { useConfig } from '@payloadcms/ui'
import React from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import { formatDate } from '../../../../../utilities/formatDate.js'

export const DateCell: React.FC<
  DefaultCellComponentProps<Date | number | string, DateFieldClient>
> = ({ cellData, field: { admin: { date } = {} } }) => {
  const {
    config: {
      admin: { dateFormat: dateFormatFromRoot },
    },
  } = useConfig()

  const dateFormat = date?.displayFormat || dateFormatFromRoot

  const { i18n } = useTranslation()

  return <span>{cellData && formatDate({ date: cellData, i18n, pattern: dateFormat })}</span>
}
