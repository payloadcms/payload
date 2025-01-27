import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'
import type { FieldAffectingData, UIField } from '../../../../../../fields/config/types'

export type Props = {
  cellData: unknown
  className?: string
  colIndex: number
  collection: SanitizedCollectionConfig
  field: FieldAffectingData | UIField
  link?: boolean
  onClick?: (Props) => void
  rowData: {
    [path: string]: unknown
    id: number | string
  }
}

export type CellComponentProps<Field = FieldAffectingData | UIField, Data = unknown> = Pick<
  Props,
  'collection' | 'rowData'
> & {
  data: Data
  field: Field
}
