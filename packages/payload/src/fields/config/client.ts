import type { ClientField, FieldBase } from '../../fields/config/types.js'

// Should not be used - ClientField should be used instead. This is why we don't export ClientField, we don't want people
// to accidentally use it instead of ClientField and get confused

export { ClientField }

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | 'typescriptSchema'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'condition'>
