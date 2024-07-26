import type { I18nClient } from '@payloadcms/translations'
import type { LabelProps, MappedComponent } from 'payload'

export type RowLabelProps = {
  RowLabelComponent?: MappedComponent
  className?: string
  i18n: I18nClient
  path: string
  rowLabel?: LabelProps['label']
  rowNumber?: number
}
