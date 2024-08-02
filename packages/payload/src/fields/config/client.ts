import type { MappedComponent } from '../../admin/types.js'
import type { Field, FieldBase } from '../../fields/config/types.js'

export type ClientFieldConfig = {
  _fieldIsPresentational: boolean
  _isFieldAffectingData: boolean
  _isSidebar: boolean
  admin: {
    components: {
      Cell: MappedComponent
      Description?: MappedComponent
      Error?: MappedComponent
      Field: MappedComponent
      Label?: MappedComponent
      afterInput?: MappedComponent[]
      beforeInput?: MappedComponent[]
    }
  }
} & Omit<Field, 'access' | 'admin' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | 'typescriptSchema'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<
  FieldBase['admin'],
  'condition' | 'description'
>
