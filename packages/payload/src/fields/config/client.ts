import type { Field, FieldBase } from '../../fields/config/types.js'
import type { MappedComponent } from '../../admin/types.js'

export type ClientFieldConfig = {
  admin: {
    components: {
      Field: MappedComponent
      Cell: MappedComponent
      Label?: MappedComponent
      Description?: MappedComponent
      Error?: MappedComponent
      beforeInput?: MappedComponent[]
      afterInput?: MappedComponent[]
    }
  }
} & Omit<Field, 'access' | 'defaultValue' | 'hooks' | 'validate' | 'admin'>

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
