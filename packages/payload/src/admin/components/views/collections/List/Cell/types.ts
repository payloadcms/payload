import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js'
import type { FieldAffectingData, UIField } from '../../../../../../fields/config/types.js'

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
  }
}
