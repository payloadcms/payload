import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type {
  BlockField,
  DateField,
  Field,
  FieldBase,
  Labels,
  RelationshipField,
  SelectField,
} from '../../fields/config/types'

export type CellProps = {
  blocks?: {
    labels: BlockField['labels']
    slug: string
  }[]
  className?: string
  dateDisplayFormat?: DateField['admin']['date']['displayFormat']
  fieldType?: Field['type']
  isFieldAffectingData?: boolean
  label?: Record<string, string> | string
  labels?: Labels
  link?: boolean
  name: FieldBase['name']
  onClick?: (Props) => void
  options?: SelectField['options']
  relationTo?: RelationshipField['relationTo']
}

export type CellComponentProps<Data = unknown> = {
  cellData: Data
  customCellContext?: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    uploadConfig?: SanitizedCollectionConfig['upload']
  }
  rowData?: Record<string, unknown>
}
