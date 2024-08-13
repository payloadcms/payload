import type { I18nClient } from '@payloadcms/translations'
import type { LabelProps, MappedComponent } from 'payload'

export type RowLabelProps = {
  readonly RowLabel?: MappedComponent
  readonly className?: string
  readonly i18n: I18nClient
  readonly path: string
  readonly rowLabel?: LabelProps['label']
  readonly rowNumber?: number
}
