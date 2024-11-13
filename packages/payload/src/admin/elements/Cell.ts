import type { I18nClient } from '@payloadcms/translations'

import type { ClientCollectionConfig } from '../../collections/config/client.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { ClientField } from '../../fields/config/client.js'
import type { Field } from '../../fields/config/types.js'
import type { Payload } from '../../types/index.js'

export type RowData = Record<string, any>

export type DefaultCellComponentProps<TCellData = any, TField extends ClientField = ClientField> = {
  readonly cellData: TCellData
  readonly className?: string
  readonly collectionConfig: ClientCollectionConfig
  readonly columnIndex?: number
  readonly customCellProps?: Record<string, any>
  readonly field: TField
  readonly link?: boolean
  readonly onClick?: (args: {
    cellData: unknown
    collectionSlug: SanitizedCollectionConfig['slug']
    rowData: RowData
  }) => void
  readonly rowData: RowData
}

export type DefaultServerCellComponentProps<
  TCellData = any,
  TField extends ClientField = ClientField,
> = {
  field: Field
  i18n: I18nClient
  payload: Payload
} & DefaultCellComponentProps<TCellData, TField>
