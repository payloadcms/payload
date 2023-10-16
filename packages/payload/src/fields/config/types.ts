/* eslint-disable no-use-before-define */
import type { EditorProps } from '@monaco-editor/react'
import type { TFunction } from 'i18next'
import type { CSSProperties } from 'react'

import monacoeditor from 'monaco-editor' // IMPORTANT - DO NOT REMOVE: This is required for pnpm's default isolated mode to work - even though the import is not used. This is due to a typescript bug: https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189. (tsbugisolatedmode)
import type { ConditionalDateProps } from '../../admin/components/elements/DatePicker/types'
import type { Description } from '../../admin/components/forms/FieldDescription/types'
import type { RowLabel } from '../../admin/components/forms/RowLabel/types'
import type { RichTextAdapter } from '../../admin/components/forms/field-types/RichText/types'
import type { User } from '../../auth'
import type { TypeWithID } from '../../collections/config/types'
import type { SanitizedConfig } from '../../config/types'
import type { PayloadRequest, RequestContext } from '../../express/types'
import type { Payload } from '../../payload'
import type { Operation, Where } from '../../types'

export type FieldHookArgs<T extends TypeWithID = any, P = any, S = any> = {
  context: RequestContext
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<T>
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation?: 'create' | 'delete' | 'read' | 'update'
  /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
  originalDoc?: T
  /** The document before changes were applied, only in `afterChange` hooks. */
  previousDoc?: T
  /** The sibling data from the previous document in `afterChange` hook. */
  previousSiblingDoc?: T
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
  data?: Partial<T>
  doc?: T
  id?: number | string
  req: PayloadRequest<U>
  siblingData?: Partial<P>
}) => Promise<boolean> | boolean

export type Condition<T extends TypeWithID = any, P = any> = (
  data: Partial<T>,
  siblingData: Partial<P>,
  { user }: { user: User },
) => boolean

export type FilterOptionsProps<T = any> = {
  data: T
  id: number | string
  relationTo: string
  siblingData: unknown
  user: Partial<User>
}

export type FilterOptions<T = any> =
  | ((options: FilterOptionsProps<T>) => Promise<Where> | Where)
  | Where
  | null

type Admin = {
  className?: string
  components?: {
    Cell?: React.ComponentType<any>
    Field?: React.ComponentType<any>
    Filter?: React.ComponentType<any>
  }
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
    placeholder?: Record<string, string> | string
    rtl?: boolean
  }
  maxLength?: number
  minLength?: number
  type: 'text'
}

export type EmailField = FieldBase & {
  admin?: Admin & {
    autoComplete?: string
    placeholder?: Record<string, string> | string
  }
  type: 'email'
}

export type TextareaField = FieldBase & {
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    rows?: number
    rtl?: boolean
  }
  maxLength?: number
  minLength?: number
  type: 'textarea'
}

export type CheckboxField = FieldBase & {
  type: 'checkbox'
}

export type DateField = FieldBase & {
  admin?: Admin & {
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
  filterOptions?: FilterOptions
  maxDepth?: number
  relationTo: string
  type: 'upload'
}

type CodeAdmin = Admin & {
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
  editorOptions?: EditorProps['options']
}

export type JSONField = Omit<FieldBase, 'admin'> & {
  admin?: JSONAdmin
  type: 'json'
}

export type SelectField = FieldBase & {
  admin?: Admin & {
    isClearable?: boolean
    isSortable?: boolean
  }
  hasMany?: boolean
  options: Option[]
  type: 'select'
}

export type RelationshipField = FieldBase & {
  admin?: Admin & {
    allowCreate?: boolean
    isSortable?: boolean
  }
  filterOptions?: FilterOptions
  hasMany?: boolean
  maxDepth?: number
  relationTo: string | string[]
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

type IsAny<T> = 0 extends 1 & T ? true : false

export type RichTextField<Value extends object = any, AdapterProps = any> = FieldBase & {
  admin?: Admin
  editor?: RichTextAdapter<Value, AdapterProps>
  type: 'richText'
} & (IsAny<AdapterProps> extends true ? {} : AdapterProps)

export type ArrayField = FieldBase & {
  admin?: Admin & {
    components?: {
      RowLabel?: RowLabel
    } & Admin['components']
    initCollapsed?: boolean | false
  }
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
    layout?: 'horizontal' | 'vertical'
  }
  options: Option[]
  type: 'radio'
}

export type Block = {
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
