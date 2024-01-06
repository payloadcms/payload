import React from 'react'
import { useTranslation } from '../../../../../providers/Translation'

import type { DateField } from 'payload/types'
import type { CellComponentProps } from '../../types'

import { formatDate } from '../../../../../utilities/formatDate'
import { useConfig } from '../../../../../providers/Config'

const DateCell: React.FC<CellComponentProps<DateField, any>> = ({ data, field }) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = useConfig()

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig

  const { i18n } = useTranslation()

  return <span>{data && formatDate(data, dateFormat, i18n?.language)}</span>
}

export default DateCell
