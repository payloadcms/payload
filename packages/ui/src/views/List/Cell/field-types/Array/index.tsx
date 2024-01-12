import React from 'react'

import type { ArrayField } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import type { CellComponentProps } from 'payload/types'

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
