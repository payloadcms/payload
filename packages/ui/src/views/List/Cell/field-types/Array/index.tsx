import React from 'react'

import type { ArrayField } from 'payload/types'
import type { CellComponentProps } from '../../types'

import { getTranslation } from '@payloadcms/translations'

const ArrayCell: React.FC<CellComponentProps<ArrayField, Record<string, unknown>>> = ({
  data,
  field,
  i18n,
}) => {
  const arrayFields = data ?? []
  const label = `${arrayFields.length} ${getTranslation(
    field?.labels?.plural || i18n.t('general:rows'),
    i18n,
  )}`

  return <span>{label}</span>
}

export default ArrayCell
