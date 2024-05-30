import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type {
  BlockField,
  DateField,
  Field,
  FieldBase,
  Labels,
  RelationshipField,
  SelectField,
} from '../../fields/config/types.js'

export type RowData = Record<string, any>

export type CellComponentProps = {
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
  onClick?: (args: {
    cellData: unknown
    collectionSlug: SanitizedCollectionConfig['slug']
    rowData: RowData
  }) => void
  options?: SelectField['options']
  relationTo?: RelationshipField['relationTo']
  richTextComponentMap?: Map<string, React.ReactNode> // any should be MappedField
  schemaPath: string
}

export type DefaultCellComponentProps<T = any> = CellComponentProps & {
  cellData: T
  customCellContext?: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    uploadConfig?: SanitizedCollectionConfig['upload']
  }
  rowData: RowData
}
