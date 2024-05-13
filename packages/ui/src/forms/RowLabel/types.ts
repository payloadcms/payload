import type { I18nClient } from '@payloadcms/translations'
import type { LabelProps } from 'payload/types'
import type React from 'react'

export type Props = {
  RowLabelComponent?: React.ReactNode
  className?: string
  i18n: I18nClient
  path: string
  rowLabel?: LabelProps['label']
  rowNumber?: number
}
