import type { MappedComponent, StaticDescription } from '../../admin/types.js'
import type { StaticLabel } from '../../config/types.js'
import type { Field, FieldBase, FieldTypes } from '../../fields/config/types.js'

export type GenericClientFieldConfig<T extends FieldTypes = FieldTypes> = {
  readonly type: T
} & ClientFieldConfig

export type ClientFieldConfig = {
  _fieldIsPresentational: boolean
  _isFieldAffectingData: boolean
  _isSidebar: boolean
  _path: string
  _schemaPath: string
  admin: {
    /**
     * These are user-defined Custom Components, if provided. All Server Components are pre-rendered, while Client Components are simply mapped for the client to render.
     * If no component is provided, these properties will be `undefined`, and the default component will be rendered.
     */
    components?: {
      Cell?: MappedComponent
      Description?: MappedComponent
      Error?: MappedComponent
      Field?: MappedComponent
      Filter?: MappedComponent
      Label?: MappedComponent
      afterInput?: MappedComponent[]
      beforeInput?: MappedComponent[]
    }
    description?: StaticDescription
    label?: StaticLabel
  } & Omit<Field['admin'], 'components' | ServerOnlyFieldAdminProperties>
} & Omit<Field, 'admin' | ServerOnlyFieldProperties> // TODO: the <Omit> breaks the field type inference

export type ServerOnlyFieldProperties =
  | 'dbName' // can be a function
  | 'editor' // This is a `richText` only property
  | 'enumName' // can be a function
  | 'filterOptions' // This is a `relationship` and `upload` only property
  | 'label'
  | 'typescriptSchema'
  | keyof Pick<FieldBase, 'access' | 'custom' | 'defaultValue' | 'hooks' | 'validate'>

export type ServerOnlyFieldAdminProperties = keyof Pick<FieldBase['admin'], 'condition'>
