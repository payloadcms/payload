import type { I18nClient } from '@payloadcms/translations'

import type { ClientCollectionConfig } from '../../collections/config/client.js'
import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type {
  ArrayFieldClient,
  BlocksFieldClient,
  CheckboxFieldClient,
  ClientField,
  CodeFieldClient,
  DateFieldClient,
  EmailFieldClient,
  Field,
  GroupFieldClient,
  JSONFieldClient,
  NumberFieldClient,
  PointFieldClient,
  RadioFieldClient,
  RelationshipFieldClient,
  SelectFieldClient,
  TextareaFieldClient,
  TextFieldClient,
  UploadFieldClient,
} from '../../fields/config/types.js'
import type { Payload } from '../../types/index.js'

export type RowData = Record<string, any>

export type DefaultCellComponentProps<
  TField extends ClientField = ClientField,
  TCellData = undefined,
> = {
  readonly cellData: TCellData extends undefined
    ? TField extends RelationshipFieldClient
      ? number | Record<string, any> | string
      : TField extends NumberFieldClient
        ? TField['hasMany'] extends true
          ? number[]
          : number
        : TField extends TextFieldClient
          ? TField['hasMany'] extends true
            ? string[]
            : string
          : TField extends
                | CodeFieldClient
                | EmailFieldClient
                | JSONFieldClient
                | RadioFieldClient
                | TextareaFieldClient
            ? string
            : TField extends BlocksFieldClient
              ? {
                  [key: string]: any
                  blockType: string
                }[]
              : TField extends CheckboxFieldClient
                ? boolean
                : TField extends DateFieldClient
                  ? Date | number | string
                  : TField extends GroupFieldClient
                    ? Record<string, any>
                    : TField extends UploadFieldClient
                      ? File | string
                      : TField extends ArrayFieldClient
                        ? Record<string, unknown>[]
                        : TField extends SelectFieldClient
                          ? TField['hasMany'] extends true
                            ? string[]
                            : string
                          : TField extends PointFieldClient
                            ? { x: number; y: number }
                            : any
    : TCellData
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
  TField extends ClientField = ClientField,
  TCellData = any,
> = {
  field: Field
  i18n: I18nClient
  payload: Payload
} & Omit<DefaultCellComponentProps<TField, TCellData>, 'field'>
