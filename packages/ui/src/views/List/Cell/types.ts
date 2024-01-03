import type {
  SanitizedCollectionConfig,
  FieldAffectingData,
  UIField,
  SanitizedConfig,
} from 'payload/types'

export type CellProps = {
  cellData: unknown
  className?: string
  colIndex: number
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  field: FieldAffectingData | UIField
  link?: boolean
  onClick?: (Props) => void
  rowData: {
    [path: string]: unknown
  }
}

export type CellComponentProps<Field = FieldAffectingData | UIField, Data = unknown> = Pick<
  CellProps,
  'config' | 'collectionConfig' | 'rowData'
> & {
  data: Data
  field: Field
}
