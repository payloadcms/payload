import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ClientField } from '../../fields/config/client.js'

export type RowData = Record<string, any>

export type CellComponentProps<TField extends ClientField = ClientField> = {
  readonly className?: string
  readonly field: TField
  readonly link?: boolean
  readonly onClick?: (args: {
    cellData: unknown
    collectionSlug: SanitizedCollectionConfig['slug']
    rowData: RowData
  }) => void
}

export type DefaultCellComponentProps<TCellData = any, TField extends ClientField = ClientField> = {
  readonly cellData: TCellData
  readonly customCellContext?: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    uploadConfig?: SanitizedCollectionConfig['upload']
  }
  readonly rowData: RowData
} & CellComponentProps<TField>
