import type { I18n } from '@payloadcms/translations'
import type { LabelProps, RowLabel, RowLabelComponent } from 'payload/types'

import React from 'react'

export type Props = {
  RowLabelComponent?: React.ReactNode
  className?: string
  i18n: I18n
  path: string
  rowLabel?: LabelProps['label']
  rowNumber?: number
}

export function isComponent(label: RowLabel): label is RowLabelComponent {
  return React.isValidElement(label)
}
