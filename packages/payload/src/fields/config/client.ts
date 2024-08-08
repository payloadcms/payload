import type { MappedComponent, StaticDescription } from '../../admin/types.js'
import type { StaticLabel } from '../../config/types.js'
import type { Field, FieldBase } from '../../fields/config/types.js'

// Should not be used - ClientFieldConfig should be used instead. This is why we don't export ClientField, we don't want people
// to accidentally use it instead of ClientFieldConfig and get confused
type ClientField = {
  [K in Field['type']]: Omit<Extract<Field, { type: K }>, ServerOnlyFieldProperties>
}[Field['type']]

export type ClientFieldConfig = {
  [K in Field['type']]: {
    _isPresentational: boolean
    _isAffectingData: boolean
    _isSidebar: boolean
    _path: string
    _schemaPath: string
    admin: {
      components?: {
        Cell?: MappedComponent
        Description?: MappedComponent
        Error?: MappedComponent
        Field?: MappedComponent
        Filter?: MappedComponent
        Label?: MappedComponent
        RowLabel?: MappedComponent
        afterInput?: MappedComponent[]
        beforeInput?: MappedComponent[]
      }
      description?: StaticDescription
      label?: StaticLabel
    } & Omit<
      Extract<ClientField, { type: K }>['admin'],
      'components' | ServerOnlyFieldAdminProperties
    >
  } & Omit<{ type: K } & ClientField, 'admin'>
}[Field['type']]

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | 'typescriptSchema'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'condition'>
