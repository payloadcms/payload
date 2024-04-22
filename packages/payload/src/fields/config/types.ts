/* eslint-disable no-use-before-define */
import type { EditorProps } from '@monaco-editor/react'
import type { TFunction } from 'i18next'
import type { CSSProperties } from 'react'

import monacoeditor from 'monaco-editor' // IMPORTANT - DO NOT REMOVE: This is required for pnpm's default isolated mode to work - even though the import is not used. This is due to a typescript bug: https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189. (tsbugisolatedmode)
import type React from 'react'

import type { ConditionalDateProps } from '../../admin/components/elements/DatePicker/types'
import type { Props as ErrorProps } from '../../admin/components/forms/Error/types'
import type { Description } from '../../admin/components/forms/FieldDescription/types'
import type { Props as LabelProps } from '../../admin/components/forms/Label/types'
import type { RowLabel } from '../../admin/components/forms/RowLabel/types'
import type { RichTextAdapter } from '../../admin/components/forms/field-types/RichText/types'
import type { User } from '../../auth'
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { DBIdentifierName } from '../../database/types'
import type { PayloadRequest, RequestContext } from '../../express/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'
import type { Payload } from '../../payload'
import type { Operation, Where } from '../../types'

export type FieldHookArgs<T extends TypeWithID = any, P = any, S = any> = {
  /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<T>
  /** The field which the hook is running against. */
  field: FieldAffectingData
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean
  /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
  global: SanitizedGlobalConfig | null
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation?: 'create' | 'delete' | 'read' | 'update'
  /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
  originalDoc?: T
  /** The document before changes were applied, only in `afterChange` hooks. */
  previousDoc?: T
  /** The sibling data of the document before changes being applied, only in `beforeChange` and `afterChange` hook. */
  previousSiblingDoc?: T
  /** The previous value of the field, before changes, only in `beforeChange` and `afterChange` hooks. */
  previousValue?: P
  /** The Express request object. It is mocked for Local API operations. */
  req: PayloadRequest
  /** The sibling data passed to a field that the hook is running against. */
  siblingData: Partial<S>
  /** The value of the field. */
  value?: P
}

export type FieldHook<T extends TypeWithID = any, P = any, S = any> = (
  args: FieldHookArgs<T, P, S>,
) => P | Promise<P>

export type FieldAccess<T extends TypeWithID = any, P = any, U = any> = (args: {
  /**
   * The incoming data used to `create` or `update` the document with. `data` is undefined during the `read` operation.
   */
  data?: Partial<T>
  /**
   * The original data of the document before the `update` is applied. `doc` is undefined during the `create` operation.
   */
  doc?: T
  /**
   * The `id` of the current document being read or updated. `id` is undefined during the `create` operation.
   */
  id?: number | string
  /** The `Express` request object containing the currently authenticated `user` */
  req: PayloadRequest<U>
  /**
   * Immediately adjacent data to this field. For example, if this is a `group` field, then `siblingData` will be the other fields within the group.
   */
  siblingData?: Partial<P>
}) => Promise<boolean> | boolean

export type Condition<T extends TypeWithID = any, P = any> = (
  data: Partial<T>,
  siblingData: Partial<P>,
  {
    user,
  }: {
    user: User
  },
) => boolean

export type FilterOptionsProps<T = any> = {
  data: T
  id: number | string
  relationTo: string
  siblingData: unknown
  user: Partial<User>
}

export type FilterOptions<T = any> =
  | ((options: FilterOptionsProps<T>) => Promise<Where | boolean> | Where | boolean)
  | Where
  | null

type Admin = {
  className?: string
  components?: {
    Cell?: React.ComponentType<any>
    Field?: React.ComponentType<any>
    Filter?: React.ComponentType<any>
  }
  /**
   * You can programmatically show / hide fields based on what other fields are doing.
   * This is also run on the server, to determine if the field should be validated.
   */
  condition?: Condition
  description?: Description
  disableBulkEdit?: boolean
  disabled?: boolean
  hidden?: boolean
  position?: 'sidebar'
  readOnly?: boolean
  style?: CSSProperties
  width?: string
}

export type Labels = {
  plural: Record<string, string> | string
  singular: Record<string, string> | string
}

export type ValidateOptions<TData, TSiblingData, TFieldConfig> = {
  config: SanitizedConfig
  data: Partial<TData>
  id?: number | string
  operation?: Operation
  payload?: Payload
  req?: PayloadRequest
  siblingData: Partial<TSiblingData>
  t: TFunction
  user?: Partial<User>
} & TFieldConfig

// TODO: Having TFieldConfig as any breaks all type checking / auto-completions for the base ValidateOptions properties.
export type Validate<TValue = any, TData = any, TSiblingData = any, TFieldConfig = any> = (
  value: TValue,
  options: ValidateOptions<TData, TSiblingData, TFieldConfig>,
) => Promise<string | true> | string | true

export type OptionObject = {
  label: Record<string, string> | string
  value: string
}

export type Option = OptionObject | string

export interface FieldBase {
  access?: {
    create?: FieldAccess
    read?: FieldAccess
    update?: FieldAccess
  }
  admin?: Admin
  /** Extension point to add your custom data. */
  custom?: Record<string, any>
  defaultValue?: any
  hidden?: boolean
  hooks?: {
    afterChange?: FieldHook[]
    afterRead?: FieldHook[]
    beforeChange?: FieldHook[]
    beforeValidate?: FieldHook[]
  }
  index?: boolean
  label?: Record<string, string> | false | string
  localized?: boolean
  name: string
  required?: boolean
  saveToJWT?: boolean | string
  unique?: boolean
  validate?: Validate
}

export type NumberField = FieldBase & {
  admin?: Admin & {
    /** Set this property to a string that will be used for browser autocomplete. */
    autoComplete?: string
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
    /** Set this property to define a placeholder string for the field. */
    placeholder?: Record<string, string> | string
    /** Set a value for the number field to increment / decrement using browser controls. */
    step?: number
  }
  /** Maximum value accepted. Used in the default `validation` function. */
  max?: number
  /** Minimum value accepted. Used in the default `validation` function. */
  min?: number
  type: 'number'
} & (
    | {
        /** Makes this field an ordered array of numbers instead of just a single number. */
        hasMany: true
        /** Maximum number of numbers in the numbers array, if `hasMany` is set to true. */
        maxRows?: number
        /** Minimum number of numbers in the numbers array, if `hasMany` is set to true. */
        minRows?: number
      }
    | {
        /** Makes this field an ordered array of numbers instead of just a single number. */
        hasMany?: false | undefined
        /** Maximum number of numbers in the numbers array, if `hasMany` is set to true. */
        maxRows?: undefined
        /** Minimum number of numbers in the numbers array, if `hasMany` is set to true. */
        minRows?: undefined
      }
  )

export type TextField = FieldBase & {
  admin?: Admin & {
    autoComplete?: string
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
    placeholder?: Record<string, string> | string
    rtl?: boolean
  }
  maxLength?: number
  minLength?: number
  type: 'text'
} & (
    | {
        /** Makes this field an ordered array of strings instead of just a single string. */
        hasMany: true
        /** Maximum number of strings in the strings array, if `hasMany` is set to true. */
        maxRows?: number
        /** Minimum number of strings in the strings array, if `hasMany` is set to true. */
        minRows?: number
      }
    | {
        /** Makes this field an ordered array of strings instead of just a single string. */
        hasMany?: false | undefined
        /** Maximum number of strings in the strings array, if `hasMany` is set to true. */
        maxRows?: undefined
        /** Minimum number of strings in the strings array, if `hasMany` is set to true. */
        minRows?: undefined
      }
  )

export type EmailField = FieldBase & {
  admin?: Admin & {
    autoComplete?: string
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
    placeholder?: Record<string, string> | string
  }
  type: 'email'
}

export type TextareaField = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
    placeholder?: Record<string, string> | string
    rows?: number
    rtl?: boolean
  }
  maxLength?: number
  minLength?: number
  type: 'textarea'
}

export type CheckboxField = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
  }
  type: 'checkbox'
}

export type DateField = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
      afterInput?: React.ComponentType<any>[]
      beforeInput?: React.ComponentType<any>[]
    }
    date?: ConditionalDateProps
    placeholder?: Record<string, string> | string
  }
  type: 'date'
}

export type GroupField = Omit<FieldBase, 'required' | 'validation'> & {
  admin?: Admin & {
    hideGutter?: boolean
  }
  fields: Field[]
  /** Customize generated GraphQL and Typescript schema names.
   * By default it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  type: 'group'
}

export type RowAdmin = Omit<Admin, 'description'>

export type RowField = Omit<FieldBase, 'admin' | 'label' | 'name'> & {
  admin?: RowAdmin
  fields: Field[]
  type: 'row'
}

export type CollapsibleField = Omit<FieldBase, 'label' | 'name'> & {
  admin?: Admin & {
    initCollapsed?: boolean | false
  }
  fields: Field[]
  label: RowLabel
  type: 'collapsible'
}

export type TabsAdmin = Omit<Admin, 'description'>

type TabBase = Omit<FieldBase, 'required' | 'validation'> & {
  description?: Description
  fields: Field[]
  interfaceName?: string
  saveToJWT?: boolean | string
}

export type NamedTab = TabBase & {
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type UnnamedTab = Omit<TabBase, 'name'> & {
  interfaceName?: never
  label: Record<string, string> | string
  localized?: never
}

export type Tab = NamedTab | UnnamedTab

export type TabsField = Omit<FieldBase, 'admin' | 'localized' | 'name' | 'saveToJWT'> & {
  admin?: TabsAdmin
  tabs: Tab[]
  type: 'tabs'
}

export type TabAsField = Tab & {
  name?: string
  type: 'tab'
}

export type UIField = {
  admin: {
    components?: {
      Cell?: React.ComponentType<any>
      Field: React.ComponentType<any>
      Filter?: React.ComponentType<any>
    }
    condition?: Condition
    disableBulkEdit?: boolean
    position?: string
    width?: string
  }
  /** Extension point to add your custom data. */
  custom?: Record<string, any>
  label?: Record<string, string> | string
  name: string
  type: 'ui'
}

export type UploadField = FieldBase & {
  admin?: {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
    }
  }
  filterOptions?: FilterOptions
  maxDepth?: number
  relationTo: string
  type: 'upload'
}

type CodeAdmin = Admin & {
  components?: {
    Error?: React.ComponentType<ErrorProps>
    Label?: React.ComponentType<LabelProps>
  }
  editorOptions?: EditorProps['options']
  language?: string
}

export type CodeField = Omit<FieldBase, 'admin'> & {
  admin?: CodeAdmin
  maxLength?: number
  minLength?: number
  type: 'code'
}

type JSONAdmin = Admin & {
  components?: {
    Error?: React.ComponentType<ErrorProps>
    Label?: React.ComponentType<LabelProps>
  }
  editorOptions?: EditorProps['options']
}

export type JSONField = Omit<FieldBase, 'admin'> & {
  admin?: JSONAdmin
  jsonSchema?: Record<string, unknown>
  type: 'json'
}

export type SelectField = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
    }
    isClearable?: boolean
    isSortable?: boolean
  }
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  /**
   * Customize the DB enum name
   */
  enumName?: DBIdentifierName
  hasMany?: boolean
  options: Option[]
  type: 'select'
}

type SharedRelationshipProperties = FieldBase & {
  filterOptions?: FilterOptions
  hasMany?: boolean
  maxDepth?: number
  type: 'relationship'
} & (
    | {
        hasMany: true
        /**
         * @deprecated Use 'maxRows' instead
         */
        max?: number
        maxRows?: number
        /**
         * @deprecated Use 'minRows' instead
         */
        min?: number
        minRows?: number
      }
    | {
        hasMany?: false | undefined
        /**
         * @deprecated Use 'maxRows' instead
         */
        max?: undefined
        maxRows?: undefined
        /**
         * @deprecated Use 'minRows' instead
         */
        min?: undefined
        minRows?: undefined
      }
  )

type RelationshipAdmin = Admin & {
  allowCreate?: boolean
  components?: {
    Error?: React.ComponentType<ErrorProps>
    Label?: React.ComponentType<LabelProps>
  }
  isSortable?: boolean
}
export type PolymorphicRelationshipField = SharedRelationshipProperties & {
  admin?: RelationshipAdmin & {
    sortOptions?: {
      [collectionSlug: string]: string
    }
  }
  relationTo: string[]
}
export type SingleRelationshipField = SharedRelationshipProperties & {
  admin?: RelationshipAdmin & {
    sortOptions?: string
  }
  relationTo: string
}
export type RelationshipField = PolymorphicRelationshipField | SingleRelationshipField

export type ValueWithRelation = {
  relationTo: string
  value: number | string
}

export function valueIsValueWithRelation(value: unknown): value is ValueWithRelation {
  return value !== null && typeof value === 'object' && 'relationTo' in value && 'value' in value
}

export type RelationshipValue =
  | (number | string)[]
  | ValueWithRelation
  | ValueWithRelation[]
  | (number | string)

export type RichTextField<
  Value extends object = any,
  AdapterProps = any,
  ExtraProperties = {},
> = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
    }
  }
  editor?: RichTextAdapter<Value, AdapterProps, AdapterProps>
  type: 'richText'
} & ExtraProperties

export type RichTextFieldRequiredEditor<
  Value extends object = any,
  AdapterProps = any,
  ExtraProperties = object,
> = Omit<RichTextField<Value, AdapterProps, ExtraProperties>, 'editor'> & {
  editor: RichTextAdapter<Value, AdapterProps, ExtraProperties>
}

export type ArrayField = FieldBase & {
  admin?: Admin & {
    components?: {
      RowLabel?: RowLabel
    } & Admin['components']
    /**
     * Disable drag and drop array sorting
     */
    disableSortable?: boolean
    initCollapsed?: boolean | false
  }
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  fields: Field[]
  /** Customize generated GraphQL and Typescript schema names.
   * By default it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'array'
}

export type RadioField = FieldBase & {
  admin?: Admin & {
    components?: {
      Error?: React.ComponentType<ErrorProps>
      Label?: React.ComponentType<LabelProps>
    }
    layout?: 'horizontal' | 'vertical'
  }
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  /**
   * Customize the DB enum name
   */
  enumName?: DBIdentifierName
  options: Option[]
  type: 'radio'
}

export type Block = {
  /** Extension point to add your custom data. */
  custom?: Record<string, any>
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  fields: Field[]
  /** @deprecated - please migrate to the interfaceName property instead. */
  graphQL?: {
    singularName?: string
  }
  imageAltText?: string
  imageURL?: string
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  labels?: Labels
  slug: string
}

export type BlockField = FieldBase & {
  admin?: Admin & {
    /**
     * Disable drag and drop array sorting
     */
    disableSortable?: boolean
    initCollapsed?: boolean | false
  }
  blocks: Block[]
  defaultValue?: unknown
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'blocks'
}

export type PointField = FieldBase & {
  type: 'point'
}

export type Field =
  | ArrayField
  | BlockField
  | CheckboxField
  | CodeField
  | CollapsibleField
  | DateField
  | EmailField
  | GroupField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | RowField
  | SelectField
  | TabsField
  | TextField
  | TextareaField
  | UIField
  | UploadField

export type FieldWithRichTextRequiredEditor =
  | Exclude<Field, RichTextField>
  | RichTextFieldRequiredEditor

export type FieldAffectingData =
  | ArrayField
  | BlockField
  | CheckboxField
  | CodeField
  | DateField
  | EmailField
  | GroupField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | SelectField
  | TabAsField
  | TextField
  | TextareaField
  | UploadField

export type NonPresentationalField =
  | ArrayField
  | BlockField
  | CheckboxField
  | CodeField
  | CollapsibleField
  | DateField
  | EmailField
  | GroupField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | RowField
  | SelectField
  | TabsField
  | TextField
  | TextareaField
  | UploadField

export type FieldWithPath = Field & {
  path?: string
}

export type FieldWithSubFields = ArrayField | CollapsibleField | GroupField | RowField

export type FieldPresentationalOnly = UIField

export type FieldWithMany = RelationshipField | SelectField

export type FieldWithMaxDepth = RelationshipField | UploadField

export function fieldHasSubFields(field: Field): field is FieldWithSubFields {
  return (
    field.type === 'group' ||
    field.type === 'array' ||
    field.type === 'row' ||
    field.type === 'collapsible'
  )
}

export function fieldIsArrayType(field: Field): field is ArrayField {
  return field.type === 'array'
}

export function fieldIsBlockType(field: Field): field is BlockField {
  return field.type === 'blocks'
}

export function fieldIsGroupType(field: Field): field is GroupField {
  return field.type === 'group'
}

export function optionIsObject(option: Option): option is OptionObject {
  return typeof option === 'object'
}

export function optionsAreObjects(options: Option[]): options is OptionObject[] {
  return Array.isArray(options) && typeof options?.[0] === 'object'
}

export function optionIsValue(option: Option): option is string {
  return typeof option === 'string'
}

export function fieldSupportsMany(field: Field): field is FieldWithMany {
  return field.type === 'select' || field.type === 'relationship'
}

export function fieldHasMaxDepth(field: Field): field is FieldWithMaxDepth {
  return (
    (field.type === 'upload' || field.type === 'relationship') && typeof field.maxDepth === 'number'
  )
}

export function fieldIsPresentationalOnly(field: Field | TabAsField): field is UIField {
  return field.type === 'ui'
}

export function fieldAffectsData(field: Field | TabAsField): field is FieldAffectingData {
  return 'name' in field && !fieldIsPresentationalOnly(field)
}

export function tabHasName(tab: Tab): tab is NamedTab {
  return 'name' in tab
}

export function fieldIsLocalized(field: Field | Tab): boolean {
  return 'localized' in field && field.localized
}

export type HookName =
  | 'afterChange'
  | 'afterRead'
  | 'beforeChange'
  | 'beforeRead'
  | 'beforeValidate'
