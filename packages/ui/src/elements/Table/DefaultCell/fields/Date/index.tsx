'use client'
import type { DateFieldClient, DefaultCellComponentProps } from '@ruya.sa/payload'

import { getObjectDotNotation } from '@ruya.sa/payload/shared'
import React from 'react'

import { useConfig } from '../../../../../providers/Config/index.js'
import { useTranslation } from '../../../../../providers/Translation/index.js'
import { formatDate } from '../../../../../utilities/formatDocTitle/formatDateTitle.js'

export const DateCell: React.FC<
  DefaultCellComponentProps<{ accessor?: string } & DateFieldClient>
> = (props) => {
  const {
    cellData,
    field: { name, accessor, admin: { date } = {}, timezone: timezoneFromField },
    rowData,
  } = props

  const {
    config: {
      admin: { dateFormat: dateFormatFromRoot },
    },
  } = useConfig()
  const { i18n } = useTranslation()

  const fieldPath = accessor || name

  const timezoneFieldName = `${fieldPath}_tz`
  const timezone =
    Boolean(timezoneFromField) && rowData
      ? getObjectDotNotation(rowData, timezoneFieldName, undefined)
      : undefined

  const dateFormat = date?.displayFormat || dateFormatFromRoot

  return (
    <span>
      {Boolean(cellData) && formatDate({ date: cellData, i18n, pattern: dateFormat, timezone })}
    </span>
  )
}
