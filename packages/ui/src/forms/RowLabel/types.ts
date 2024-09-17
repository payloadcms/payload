import type { I18nClient } from '@payloadcms/translations'
import type { MappedComponent, StaticLabel } from 'payload'

export type RowLabelProps = {
  readonly className?: string
  readonly i18n: I18nClient
  readonly path: string
  readonly RowLabel?: MappedComponent
  readonly rowLabel?: StaticLabel
  readonly rowNumber?: number
}
