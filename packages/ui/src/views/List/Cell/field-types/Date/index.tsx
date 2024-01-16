import React from 'react'

import type { CellComponentProps, DateField } from 'payload/types'

import { formatDate } from '../../../../../utilities/formatDate'

const DateCell: React.FC<CellComponentProps<DateField, any>> = ({ config, data, field, i18n }) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = config

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig

  return <span>{data && formatDate(data, dateFormat, i18n.language)}</span>
}

export default DateCell
