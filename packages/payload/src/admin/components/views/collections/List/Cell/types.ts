import { FieldAffectingData, UIField } from '../../../../../../fields/config/types.js';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types.js';

export type Props = {
  field: UIField | FieldAffectingData
  colIndex: number
  collection: SanitizedCollectionConfig
  cellData: unknown
  rowData: {
    [path: string]: unknown
  }
  link?: boolean
  onClick?: (Props) => void
  className?: string
}
