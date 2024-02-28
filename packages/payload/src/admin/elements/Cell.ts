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
  /**
   * A custom component to override the default cell component. If this is not set, the React component will be
   * taken from cellComponents based on the field type.
   *
   * This is used to provide the RichText cell component for the RichText field.
   */
  CellComponentOverride?: React.ReactNode
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
    rowData: Record<string, unknown>
  }) => void
  options?: SelectField['options']
  relationTo?: RelationshipField['relationTo']
  richTextComponentMap?: Map<string, React.ReactNode> // any should be MappedField
}

export type CellComponentProps<Data = unknown> = {
  cellData: Data
  customCellContext?: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    uploadConfig?: SanitizedCollectionConfig['upload']
  }
  richTextComponentMap?: Map<string, React.ReactNode>
  rowData?: Record<string, unknown>
}
