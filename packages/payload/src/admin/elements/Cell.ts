import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ClientFieldConfig } from '../../fields/config/client.js'

export type RowData = Record<string, any>

export type CellComponentProps = {
  readonly className?: string
  readonly field: ClientFieldConfig
  readonly link?: boolean
  readonly onClick?: (args: {
    cellData: unknown
    collectionSlug: SanitizedCollectionConfig['slug']
    rowData: RowData
  }) => void
  readonly richTextComponentMap?: Map<string, unknown>
}

export type DefaultCellComponentProps<T = any> = {
  readonly cellData: T
  readonly customCellContext?: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    uploadConfig?: SanitizedCollectionConfig['upload']
  }
  readonly rowData: RowData
} & CellComponentProps
