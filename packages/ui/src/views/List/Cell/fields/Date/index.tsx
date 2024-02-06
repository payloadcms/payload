'use client'
import React from 'react'

import type { CellComponentProps } from 'payload/types'

import { formatDate } from '../../../../../utilities/formatDate'
import { useTranslation } from '../../../../../providers/Translation'

export const DateCell: React.FC<CellComponentProps<any>> = ({ config, data, field }) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = config

  const { i18n } = useTranslation()

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig

  return <span>{data && formatDate(data, dateFormat, i18n.language)}</span>
}
