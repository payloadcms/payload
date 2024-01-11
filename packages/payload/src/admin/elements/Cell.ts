import type { I18n } from '@payloadcms/translations'

import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { FieldAffectingData, UIField } from '../../fields/config/types'

export type CellProps = {
  cellData: unknown
  className?: string
  colIndex: number
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  field: FieldAffectingData | UIField
  i18n: I18n
  link?: boolean
  onClick?: (Props) => void
  rowData: {
    [path: string]: unknown
  }
}

export type CellComponentProps<Field = FieldAffectingData | UIField, Data = unknown> = Pick<
  CellProps,
  'collectionConfig' | 'config' | 'rowData'
> & {
  data: Data
  field: Field
  i18n: I18n
}
