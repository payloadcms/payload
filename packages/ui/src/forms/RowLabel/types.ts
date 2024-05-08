import type { I18n } from '@payloadcms/translations'
import type { LabelProps } from 'payload/types'
import type React from 'react'

export type Props = {
  RowLabelComponent?: React.ReactNode
  className?: string
  i18n: I18n
  path: string
  rowLabel?: LabelProps['label']
  rowNumber?: number
}
