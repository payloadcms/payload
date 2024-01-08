import React from 'react'

import type { DateField } from 'payload/types'
import type { CellComponentProps } from '../../types'

import { formatDate } from '../../../../../utilities/formatDate'

const DateCell: React.FC<CellComponentProps<DateField, any>> = ({ config, data, field }) => {
  const {
    admin: { dateFormat: dateFormatFromConfig },
  } = config

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig

  // TODO(i18n)
  const i18n = undefined

  return <span>{data && formatDate(data, dateFormat, i18n?.language)}</span>
}

export default DateCell
