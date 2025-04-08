// @ts-strict-ignore
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { EditorProps } from '@monaco-editor/react'
import type { JSONSchema4 } from 'json-schema'
import type { CSSProperties } from 'react'
import type React from 'react'
import type { DeepUndefinable, MarkRequired } from 'ts-essentials'

import type {
  JoinFieldClientProps,
  JoinFieldErrorClientComponent,
  JoinFieldErrorServerComponent,
  JoinFieldLabelClientComponent,
  JoinFieldLabelServerComponent,
} from '../../admin/fields/Join.js'
import type { FieldClientComponent, FieldServerComponent } from '../../admin/forms/Field.js'
import type { RichTextAdapter, RichTextAdapterProvider } from '../../admin/RichText.js'
import type {
  ArrayFieldClientProps,
  ArrayFieldErrorClientComponent,
  ArrayFieldErrorServerComponent,
  ArrayFieldLabelClientComponent,
  ArrayFieldLabelServerComponent,
  BlocksFieldClientProps,
  BlocksFieldErrorClientComponent,
  BlocksFieldErrorServerComponent,
  BlocksFieldLabelClientComponent,
  BlocksFieldLabelServerComponent,
  CheckboxFieldClientProps,
  CheckboxFieldErrorClientComponent,
  CheckboxFieldErrorServerComponent,
  CheckboxFieldLabelClientComponent,
  CheckboxFieldLabelServerComponent,
  ClientTab,
  CodeFieldClientProps,
  CodeFieldErrorClientComponent,
  CodeFieldErrorServerComponent,
  CodeFieldLabelClientComponent,
  CodeFieldLabelServerComponent,
  CollapsibleFieldClientProps,
  CollapsibleFieldLabelClientComponent,
  CollapsibleFieldLabelServerComponent,
  ConditionalDateProps,
  DateFieldClientProps,
  DateFieldErrorClientComponent,
  DateFieldErrorServerComponent,
  DateFieldLabelClientComponent,
  DateFieldLabelServerComponent,
  DefaultCellComponentProps,
  DefaultServerCellComponentProps,
  Description,
  EmailFieldClientProps,
  EmailFieldErrorClientComponent,
  EmailFieldErrorServerComponent,
  EmailFieldLabelClientComponent,
  EmailFieldLabelServerComponent,
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  GroupFieldClientProps,
  GroupFieldLabelClientComponent,
  GroupFieldLabelServerComponent,
  HiddenFieldProps,
  JSONFieldClientProps,
  JSONFieldErrorClientComponent,
  JSONFieldErrorServerComponent,
  JSONFieldLabelClientComponent,
  JSONFieldLabelServerComponent,
  NumberFieldClientProps,
  NumberFieldErrorClientComponent,
  NumberFieldErrorServerComponent,
  NumberFieldLabelClientComponent,
  NumberFieldLabelServerComponent,
  PointFieldClientProps,
  PointFieldErrorClientComponent,
  PointFieldErrorServerComponent,
  PointFieldLabelClientComponent,
  PointFieldLabelServerComponent,
  RadioFieldClientProps,
  RadioFieldErrorClientComponent,
  RadioFieldErrorServerComponent,
  RadioFieldLabelClientComponent,
  RadioFieldLabelServerComponent,
  RelationshipFieldClientProps,
  RelationshipFieldErrorClientComponent,
  RelationshipFieldErrorServerComponent,
  RelationshipFieldLabelClientComponent,
  RelationshipFieldLabelServerComponent,
  RichTextFieldClientProps,
  RowFieldClientProps,
  RowLabelComponent,
  SelectFieldClientProps,
  SelectFieldErrorClientComponent,
  SelectFieldErrorServerComponent,
  SelectFieldLabelClientComponent,
  SelectFieldLabelServerComponent,
  StaticDescription,
  TabsFieldClientProps,
  TextareaFieldClientProps,
  TextareaFieldErrorClientComponent,
  TextareaFieldErrorServerComponent,
  TextareaFieldLabelClientComponent,
  TextareaFieldLabelServerComponent,
  TextFieldClientProps,
  TextFieldErrorClientComponent,
  TextFieldErrorServerComponent,
  TextFieldLabelClientComponent,
  TextFieldLabelServerComponent,
  UploadFieldClientProps,
} from '../../admin/types.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type {
  CustomComponent,
  LabelFunction,
  PayloadComponent,
  StaticLabel,
} from '../../config/types.js'
import type { DBIdentifierName } from '../../database/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type {
  ArrayFieldValidation,
  BlocksFieldValidation,
  BlockSlug,
  CheckboxFieldValidation,
  CodeFieldValidation,
  CollectionSlug,
  DateFieldValidation,
  EmailFieldValidation,
  JSONFieldValidation,
  PointFieldValidation,
  RadioFieldValidation,
  RequestContext,
  Sort,
  TextareaFieldValidation,
} from '../../index.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type {
  DefaultValue,
  JsonObject,
  Operation,
  PayloadRequest,
  Where,
} from '../../types/index.js'
import type {
  NumberFieldManyValidation,
  NumberFieldSingleValidation,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
  SelectFieldManyValidation,
  SelectFieldSingleValidation,
  TextFieldManyValidation,
  TextFieldSingleValidation,
  UploadFieldManyValidation,
  UploadFieldSingleValidation,
} from '../validations.js'

export type FieldHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
  /**
   * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
   */
  blockData: JsonObject | undefined
  /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  /**
   * Only available in `afterRead` hooks
   */
  currentDepth?: number
  /**
   * Only available in `afterRead` hooks
   */
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<TData>
  /**
   * Only available in the `afterRead` hook.
   */
  depth?: number
  draft?: boolean
  /** The field which the hook is running against. */
  field: FieldAffectingData
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean
  /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
  global: null | SanitizedGlobalConfig
  indexPath: number[]
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation?: 'create' | 'delete' | 'read' | 'update'
  /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
  originalDoc?: TData
  overrideAccess?: boolean
  /**
   * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
   */
  path: (number | string)[]
  /** The document before changes were applied, only in `afterChange` hooks. */
  previousDoc?: TData
  /** The sibling data of the document before changes being applied, only in `beforeChange`, `beforeValidate`, `beforeDuplicate` and `afterChange` field hooks. */
  previousSiblingDoc?: TData
  /** The previous value of the field, before changes, only in `beforeChange`, `afterChange`, `beforeDuplicate` and `beforeValidate` field hooks. */
  previousValue?: TValue
  /** The Express request object. It is mocked for Local API operations. */
  req: PayloadRequest
  /**
   * The schemaPath of the field, e.g. ["group", "myArray", "textField"]. The schemaPath is the path but without indexes and would be used in the context of field schemas, not field data.
   */
  schemaPath: string[]
  /**
   * Only available in the `afterRead` hook.
   */
  showHiddenFields?: boolean
  /** The sibling data passed to a field that the hook is running against. */
  siblingData: Partial<TSiblingData>
  /**
   * The original siblingData with locales (not modified by any hooks). Only available in `beforeChange` and `beforeDuplicate` field hooks.
   */
  siblingDocWithLocales?: Record<string, unknown>
  /**
   * The sibling fields of the field which the hook is running against.
   */
  siblingFields: (Field | TabAsField)[]
  /** The value of the field. */
  value?: TValue
}

export type FieldHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (
  args: FieldHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type FieldAccessArgs<TData extends TypeWithID = any, TSiblingData = any> = {
  /**
   * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
   */
  blockData?: JsonObject | undefined
  /**
   * The incoming, top-level document data used to `create` or `update` the document with.
   */
  data?: Partial<TData>
  /**
   * The original data of the document before the `update` is applied. `doc` is undefined during the `create` operation.
   */
  doc?: TData
  /**
   * The `id` of the current document being read or updated. `id` is undefined during the `create` operation.
   */
  id?: number | string
  /** The `payload` object to interface with the payload API */
  req: PayloadRequest
  /**
   * Immediately adjacent data to this field. For example, if this is a `group` field, then `siblingData` will be the other fields within the group.
   */
  siblingData?: Partial<TSiblingData>
}

export type FieldAccess<TData extends TypeWithID = any, TSiblingData = any> = (
  args: FieldAccessArgs<TData, TSiblingData>,
) => boolean | Promise<boolean>

//TODO: In 4.0, we should replace the three parameters of the condition function with a single, named parameter object
export type Condition<TData extends TypeWithID = any, TSiblingData = any> = (
  /**
   * The top-level document data
   */
  data: Partial<TData>,
  /**
   * Immediately adjacent data to this field. For example, if this is a `group` field, then `siblingData` will be the other fields within the group.
   */
  siblingData: Partial<TSiblingData>,
  {
    blockData,
    path,
    user,
  }: {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData: Partial<TData>
    /**
     * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
     */
    path: (number | string)[]
    user: PayloadRequest['user']
  },
) => boolean

export type FilterOptionsProps<TData = any> = {
  /**
   * The data of the nearest parent block. Will be `undefined` if the field is not within a block or when called on a `Filter` component within the list view.
   */
  blockData: TData
  /**
   * An object containing the full collection or global document currently being edited. Will be an empty object when called on a `Filter` component within the list view.
   */
  data: TData
  /**
   * The `id` of the current document being edited. Will be undefined during the `create` operation or when called on a `Filter` component within the list view.
   */
  id: number | string
  /**
   * The collection `slug` to filter against, limited to this field's `relationTo` property.
   */
  relationTo: CollectionSlug
  req: PayloadRequest
  /**
   * An object containing document data that is scoped to only fields within the same parent of this field. Will be an empty object when called on a `Filter` component within the list view.
   */
  siblingData: unknown
  /**
   * An object containing the currently authenticated user.
   */
  user: Partial<PayloadRequest['user']>
}

export type FilterOptionsFunc<TData = any> = (
  options: FilterOptionsProps<TData>,
) => boolean | Promise<boolean | Where> | Where

export type FilterOptions<TData = any> =
  | ((options: FilterOptionsProps<TData>) => boolean | Promise<boolean | Where> | Where)
  | null
  | Where

type Admin = {
  className?: string
  components?: {
    Cell?: PayloadComponent<DefaultServerCellComponentProps, DefaultCellComponentProps>
    Description?: PayloadComponent<FieldDescriptionServerProps, FieldDescriptionClientProps>
    Diff?: PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>
    Field?: PayloadComponent<FieldClientComponent | FieldServerComponent>
    /**
     * The Filter component has to be a client component
     */
    Filter?: PayloadComponent
  }
  /**
   * You can programmatically show / hide fields based on what other fields are doing.
   * This is also run on the server, to determine if the field should be validated.
   */
  condition?: Condition
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
  /**
   * The field description will be displayed next to the field in the admin UI. Additionally,
   * we use the field description to generate JSDoc comments for the generated TypeScript types.
   */
  description?: Description
  disableBulkEdit?: boolean
  disabled?: boolean
  /**
   * Shows / hides fields from appearing in the list view column selector.
   * @type boolean
   */
  disableListColumn?: boolean
  /**
   * Shows / hides fields from appearing in the list view filter options.
   * @type boolean
   */
  disableListFilter?: boolean
  hidden?: boolean
  position?: 'sidebar'
  readOnly?: boolean
  style?: CSSProperties
  width?: CSSProperties['width']
}

export type AdminClient = {
  className?: string
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
  description?: StaticDescription
  disableBulkEdit?: boolean
  disabled?: boolean
  /**
   * Shows / hides fields from appearing in the list view column selector.
   * @type boolean
   */
  disableListColumn?: boolean
  /**
   * Shows / hides fields from appearing in the list view filter options.
   * @type boolean
   */
  disableListFilter?: boolean
  hidden?: boolean
  position?: 'sidebar'
  readOnly?: boolean
  style?: { '--field-width'?: CSSProperties['width'] } & CSSProperties
  width?: CSSProperties['width']
}

export type Labels = {
  plural: LabelFunction | StaticLabel
  singular: LabelFunction | StaticLabel
}

export type LabelsClient = {
  plural: StaticLabel
  singular: StaticLabel
}

export type BaseValidateOptions<TData, TSiblingData, TValue> = {
  /**
  /**
   * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
   */
  blockData: Partial<TData>
  collectionSlug?: string
  data: Partial<TData>
  event?: 'onChange' | 'submit'
  id?: number | string
  operation?: Operation
  /**
   * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
   */
  path: (number | string)[]
  preferences: DocumentPreferences
  previousValue?: TValue
  req: PayloadRequest
  required?: boolean
  siblingData: Partial<TSiblingData>
}

export type ValidateOptions<
  TData,
  TSiblingData,
  TFieldConfig extends object,
  TValue,
> = BaseValidateOptions<TData, TSiblingData, TValue> & TFieldConfig

export type Validate<
  TValue = any,
  TData = any,
  TSiblingData = any,
  TFieldConfig extends object = object,
> = (
  value: null | TValue | undefined,
  options: ValidateOptions<TData, TSiblingData, TFieldConfig, TValue>,
) => Promise<string | true> | string | true

export type OptionLabel =
  | (() => React.JSX.Element)
  | LabelFunction
  | React.JSX.Element
  | StaticLabel

export type OptionObject = {
  label: OptionLabel
  value: string
}

export type Option = OptionObject | string

export type FieldGraphQLType = {
  graphQL?: {
    /**
     * Complexity for the query. This is used to limit the complexity of the join query.
     *
     * @default 10
     */
    complexity?: number
  }
}

export interface FieldBase {
  /**
   * Do not set this property manually. This is set to true during sanitization, to avoid
   * sanitizing the same field multiple times.
   */
  _sanitized?: boolean
  access?: {
    create?: FieldAccess
    read?: FieldAccess
    update?: FieldAccess
  }
  admin?: Admin
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  defaultValue?: DefaultValue
  hidden?: boolean
  hooks?: {
    afterChange?: FieldHook[]
    afterRead?: FieldHook[]
    beforeChange?: FieldHook[]
    /**
     * Runs before a document is duplicated to prevent errors in unique fields or return null to use defaultValue.
     */
    beforeDuplicate?: FieldHook[]
    beforeValidate?: FieldHook[]
  }
  index?: boolean
  label?: false | LabelFunction | StaticLabel
  localized?: boolean
  /**
   * The name of the field. Must be alphanumeric and cannot contain ' . '
   *
   * Must not be one of reserved field names: ['__v', 'salt', 'hash', 'file']
   * @link https://payloadcms.com/docs/fields/overview#field-names
   */
  name: string
  required?: boolean
  saveToJWT?: boolean | string
  /**
   * Allows you to modify the base JSON schema that is generated during generate:types for this field.
   * This JSON schema will be used to generate the TypeScript interface of this field.
   */
  typescriptSchema?: Array<(args: { jsonSchema: JSONSchema4 }) => JSONSchema4>
  unique?: boolean
  validate?: Validate
  /**
   * Pass `true` to disable field in the DB
   * for [Virtual Fields](https://payloadcms.com/blog/learn-how-virtual-fields-can-help-solve-common-cms-challenges):
   * A virtual field cannot be used in `admin.useAsTitle`
   */
  virtual?: boolean
}

export interface FieldBaseClient {
  admin?: AdminClient
  hidden?: boolean
  index?: boolean
  label?: StaticLabel
  localized?: boolean
  /**
   * The name of the field. Must be alphanumeric and cannot contain ' . '
   *
   * Must not be one of reserved field names: ['__v', 'salt', 'hash', 'file']
   * @link https://payloadcms.com/docs/fields/overview#field-names
   */
  name: string
  required?: boolean
  saveToJWT?: boolean | string
  /**
   * Allows you to modify the base JSON schema that is generated during generate:types for this field.
   * This JSON schema will be used to generate the TypeScript interface of this field.
   */
  typescriptSchema?: Array<(args: { jsonSchema: JSONSchema4 }) => JSONSchema4>
  unique?: boolean
}

export type NumberField = {
  admin?: {
    /** Set this property to a string that will be used for browser autocomplete. */
    autoComplete?: string
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<NumberFieldErrorClientComponent | NumberFieldErrorServerComponent>
      Label?: CustomComponent<NumberFieldLabelClientComponent | NumberFieldLabelServerComponent>
    } & Admin['components']
    /** Set this property to define a placeholder string for the field. */
    placeholder?: Record<string, string> | string
    /** Set a value for the number field to increment / decrement using browser controls. */
    step?: number
  } & Admin
  /** Maximum value accepted. Used in the default `validate` function. */
  max?: number
  /** Minimum value accepted. Used in the default `validate` function. */
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
      validate?: NumberFieldManyValidation
    }
  | {
      /** Makes this field an ordered array of numbers instead of just a single number. */
      hasMany?: false | undefined
      /** Maximum number of numbers in the numbers array, if `hasMany` is set to true. */
      maxRows?: undefined
      /** Minimum number of numbers in the numbers array, if `hasMany` is set to true. */
      minRows?: undefined
      validate?: NumberFieldSingleValidation
    }
) &
  Omit<FieldBase, 'validate'>

export type NumberFieldClient = {
  admin?: AdminClient & Pick<NumberField['admin'], 'autoComplete' | 'placeholder' | 'step'>
} & FieldBaseClient &
  Pick<NumberField, 'hasMany' | 'max' | 'maxRows' | 'min' | 'minRows' | 'type'>

export type TextField = {
  admin?: {
    autoComplete?: string
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<TextFieldErrorClientComponent | TextFieldErrorServerComponent>
      Label?: CustomComponent<TextFieldLabelClientComponent | TextFieldLabelServerComponent>
    } & Admin['components']
    placeholder?: Record<string, string> | string
    rtl?: boolean
  } & Admin
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
      validate?: TextFieldManyValidation
    }
  | {
      /** Makes this field an ordered array of strings instead of just a single string. */
      hasMany?: false | undefined
      /** Maximum number of strings in the strings array, if `hasMany` is set to true. */
      maxRows?: undefined
      /** Minimum number of strings in the strings array, if `hasMany` is set to true. */
      minRows?: undefined
      validate?: TextFieldSingleValidation
    }
) &
  Omit<FieldBase, 'validate'>

export type TextFieldClient = {
  admin?: AdminClient & Pick<TextField['admin'], 'autoComplete' | 'placeholder' | 'rtl'>
} & FieldBaseClient &
  Pick<TextField, 'hasMany' | 'maxLength' | 'maxRows' | 'minLength' | 'minRows' | 'type'>

export type EmailField = {
  admin?: {
    autoComplete?: string
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<EmailFieldErrorClientComponent | EmailFieldErrorServerComponent>
      Label?: CustomComponent<EmailFieldLabelClientComponent | EmailFieldLabelServerComponent>
    } & Admin['components']
    placeholder?: Record<string, string> | string
  } & Admin
  type: 'email'
  validate?: EmailFieldValidation
} & Omit<FieldBase, 'validate'>

export type EmailFieldClient = {
  admin?: AdminClient & Pick<EmailField['admin'], 'autoComplete' | 'placeholder'>
} & FieldBaseClient &
  Pick<EmailField, 'type'>

export type TextareaField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<TextareaFieldErrorClientComponent | TextareaFieldErrorServerComponent>
      Label?: CustomComponent<TextareaFieldLabelClientComponent | TextareaFieldLabelServerComponent>
    } & Admin['components']
    placeholder?: Record<string, string> | string
    rows?: number
    rtl?: boolean
  } & Admin
  maxLength?: number
  minLength?: number
  type: 'textarea'
  validate?: TextareaFieldValidation
} & Omit<FieldBase, 'validate'>

export type TextareaFieldClient = {
  admin?: AdminClient & Pick<TextareaField['admin'], 'placeholder' | 'rows' | 'rtl'>
} & FieldBaseClient &
  Pick<TextareaField, 'maxLength' | 'minLength' | 'type'>

export type CheckboxField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<CheckboxFieldErrorClientComponent | CheckboxFieldErrorServerComponent>
      Label?: CustomComponent<CheckboxFieldLabelClientComponent | CheckboxFieldLabelServerComponent>
    } & Admin['components']
  } & Admin
  type: 'checkbox'
  validate?: CheckboxFieldValidation
} & Omit<FieldBase, 'validate'>

export type CheckboxFieldClient = {
  admin?: AdminClient
} & FieldBaseClient &
  Pick<CheckboxField, 'type'>

export type DateField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<DateFieldErrorClientComponent | DateFieldErrorServerComponent>
      Label?: CustomComponent<DateFieldLabelClientComponent | DateFieldLabelServerComponent>
    } & Admin['components']
    date?: ConditionalDateProps
    placeholder?: Record<string, string> | string
  } & Admin
  /**
   * Enable timezone selection in the admin interface.
   */
  timezone?: true
  type: 'date'
  validate?: DateFieldValidation
} & Omit<FieldBase, 'validate'>

export type DateFieldClient = {
  admin?: AdminClient & Pick<DateField['admin'], 'date' | 'placeholder'>
} & FieldBaseClient &
  Pick<DateField, 'timezone' | 'type'>

export type GroupField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Label?: CustomComponent<GroupFieldLabelClientComponent | GroupFieldLabelServerComponent>
    } & Admin['components']
    hideGutter?: boolean
  } & Admin
  fields: Field[]
  /** Customize generated GraphQL and Typescript schema names.
   * By default, it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  type: 'group'
  validate?: Validate<unknown, unknown, unknown, GroupField>
} & Omit<FieldBase, 'required' | 'validate'>

export type GroupFieldClient = {
  admin?: AdminClient & Pick<GroupField['admin'], 'hideGutter'>
  fields: ClientField[]
} & Omit<FieldBaseClient, 'required'> &
  Pick<GroupField, 'interfaceName' | 'type'>

export type RowField = {
  admin?: Omit<Admin, 'description'>
  fields: Field[]
  type: 'row'
} & Omit<FieldBase, 'admin' | 'label' | 'localized' | 'name' | 'validate' | 'virtual'>

export type RowFieldClient = {
  admin?: Omit<AdminClient, 'description'>
  fields: ClientField[]
} & Omit<FieldBaseClient, 'admin' | 'label' | 'name'> &
  Pick<RowField, 'type'>

export type CollapsibleField = {
  fields: Field[]
  type: 'collapsible'
} & (
  | {
      admin: {
        components: {
          afterInput?: CustomComponent[]
          beforeInput?: CustomComponent[]
          Label: CustomComponent<
            CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent
          >
        } & Admin['components']
        initCollapsed?: boolean
      } & Admin
      label?: Required<FieldBase['label']>
    }
  | {
      admin?: {
        components?: {
          afterInput?: CustomComponent[]
          beforeInput?: CustomComponent[]
          Label?: CustomComponent<
            CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent
          >
        } & Admin['components']
        initCollapsed?: boolean
      } & Admin
      label: Required<FieldBase['label']>
    }
) &
  Omit<FieldBase, 'label' | 'localized' | 'name' | 'validate' | 'virtual'>

export type CollapsibleFieldClient = {
  admin?: {
    initCollapsed?: boolean
  } & AdminClient
  fields: ClientField[]
  label: StaticLabel
} & Omit<FieldBaseClient, 'label' | 'name' | 'validate'> &
  Pick<CollapsibleField, 'type'>

type TabBase = {
  /**
   * @deprecated
   * Use `admin.description` instead. This will be removed in a future major version.
   */
  description?: LabelFunction | StaticDescription
  fields: Field[]
  id?: string
  interfaceName?: string
  saveToJWT?: boolean | string
} & Omit<FieldBase, 'required' | 'validate'>

export type NamedTab = {
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
} & TabBase

export type UnnamedTab = {
  interfaceName?: never
  /**
   * Can be either:
   * - A string, which will be used as the tab's label.
   * - An object, where the key is the language code and the value is the label.
   */
  label:
    | {
        [selectedLanguage: string]: string
      }
    | LabelFunction
    | string
  localized?: never
} & Omit<TabBase, 'name' | 'virtual'>

export type Tab = NamedTab | UnnamedTab
export type TabsField = {
  admin?: Omit<Admin, 'description'>
  type: 'tabs'
} & {
  tabs: Tab[]
} & Omit<FieldBase, 'admin' | 'localized' | 'name' | 'saveToJWT' | 'virtual'>

export type TabsFieldClient = {
  admin?: Omit<AdminClient, 'description'>
  tabs: ClientTab[]
} & Omit<FieldBaseClient, 'admin' | 'localized' | 'name' | 'saveToJWT'> &
  Pick<TabsField, 'type'>

export type TabAsField = {
  name?: string
  type: 'tab'
} & Tab

export type TabAsFieldClient = ClientTab & Pick<TabAsField, 'name' | 'type'>

export type UIField = {
  admin: {
    components?: {
      /**
       * Allow any custom components to be added to the UI field. This allows
       * the UI field to be used as a vessel for getting components rendered.
       */
      [key: string]: PayloadComponent | undefined
      Cell?: CustomComponent
      // Can be optional, in case the UI field is just used as a vessel for custom components
      Field?: CustomComponent
      /**
       * The Filter component has to be a client component
       */
      Filter?: PayloadComponent
    } & Admin['components']
    condition?: Condition
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    /**
     * Set `false` make the UI field appear in the list view column selector. `true` by default for UI fields.
     * @default true
     */
    disableBulkEdit?: boolean
    /**
     * Shows / hides fields from appearing in the list view column selector.
     * @type boolean
     */
    disableListColumn?: boolean
    position?: string
    width?: CSSProperties['width']
  }
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  label?: Record<string, string> | string
  name: string
  type: 'ui'
}

export type UIFieldClient = {
  // still include FieldBaseClient.admin (even if it's undefinable) so that we don't need constant type checks (e.g. if('xy' in field))

  admin: DeepUndefinable<FieldBaseClient['admin']> &
    Pick<
      UIField['admin'],
      'custom' | 'disableBulkEdit' | 'disableListColumn' | 'position' | 'width'
    >
} & Omit<DeepUndefinable<FieldBaseClient>, 'admin'> & // still include FieldBaseClient (even if it's undefinable) so that we don't need constant type checks (e.g. if('xy' in field))
  Pick<UIField, 'label' | 'name' | 'type'>

type SharedUploadProperties = {
  /**
   * Toggle the preview in the admin interface.
   */
  displayPreview?: boolean
  filterOptions?: FilterOptions
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
  type: 'upload'
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
      validate?: UploadFieldManyValidation
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
      validate?: UploadFieldSingleValidation
    }
) &
  FieldGraphQLType &
  Omit<FieldBase, 'validate'>

type SharedUploadPropertiesClient = FieldBaseClient &
  Pick<
    SharedUploadProperties,
    'hasMany' | 'max' | 'maxDepth' | 'maxRows' | 'min' | 'minRows' | 'type'
  >

type UploadAdmin = {
  allowCreate?: boolean
  components?: {
    Error?: CustomComponent<
      RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent
    >
    Label?: CustomComponent<
      RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent
    >
  } & Admin['components']
  isSortable?: boolean
} & Admin

type UploadAdminClient = AdminClient & Pick<UploadAdmin, 'allowCreate' | 'isSortable'>

export type PolymorphicUploadField = {
  admin?: {
    sortOptions?: Partial<Record<CollectionSlug, string>>
  } & UploadAdmin
  relationTo: CollectionSlug[]
} & SharedUploadProperties

export type PolymorphicUploadFieldClient = {
  admin?: {
    sortOptions?: Pick<PolymorphicUploadField['admin'], 'sortOptions'>
  } & UploadAdminClient
} & Pick<PolymorphicUploadField, 'displayPreview' | 'maxDepth' | 'relationTo' | 'type'> &
  SharedUploadPropertiesClient

export type SingleUploadField = {
  admin?: {
    sortOptions?: string
  } & UploadAdmin
  relationTo: CollectionSlug
} & SharedUploadProperties

export type SingleUploadFieldClient = {
  admin?: Pick<SingleUploadField['admin'], 'sortOptions'> & UploadAdminClient
} & Pick<SingleUploadField, 'displayPreview' | 'maxDepth' | 'relationTo' | 'type'> &
  SharedUploadPropertiesClient

export type UploadField = /* PolymorphicUploadField | */ SingleUploadField

export type UploadFieldClient = /* PolymorphicUploadFieldClient | */ SingleUploadFieldClient

export type CodeField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<CodeFieldErrorClientComponent | CodeFieldErrorServerComponent>
      Label?: CustomComponent<CodeFieldLabelClientComponent | CodeFieldLabelServerComponent>
    } & Admin['components']
    editorOptions?: EditorProps['options']
    language?: string
  } & Admin
  maxLength?: number
  minLength?: number
  type: 'code'
  validate?: CodeFieldValidation
} & Omit<FieldBase, 'admin' | 'validate'>

export type CodeFieldClient = {
  admin?: AdminClient & Pick<CodeField['admin'], 'editorOptions' | 'language'>
} & Omit<FieldBaseClient, 'admin'> &
  Pick<CodeField, 'maxLength' | 'minLength' | 'type'>

export type JSONField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<JSONFieldErrorClientComponent | JSONFieldErrorServerComponent>
      Label?: CustomComponent<JSONFieldLabelClientComponent | JSONFieldLabelServerComponent>
    } & Admin['components']
    editorOptions?: EditorProps['options']
    maxHeight?: number
  } & Admin

  jsonSchema?: {
    fileMatch: string[]
    schema: JSONSchema4
    uri: string
  }
  type: 'json'
  validate?: JSONFieldValidation
} & Omit<FieldBase, 'admin' | 'validate'>

export type JSONFieldClient = {
  admin?: AdminClient & Pick<JSONField['admin'], 'editorOptions' | 'maxHeight'>
} & Omit<FieldBaseClient, 'admin'> &
  Pick<JSONField, 'jsonSchema' | 'type'>

export type SelectField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<SelectFieldErrorClientComponent | SelectFieldErrorServerComponent>
      Label?: CustomComponent<SelectFieldLabelClientComponent | SelectFieldLabelServerComponent>
    } & Admin['components']
    isClearable?: boolean
    isSortable?: boolean
  } & Admin
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  /**
   * Customize the DB enum name
   */
  enumName?: DBIdentifierName
  hasMany?: boolean
  /** Customize generated GraphQL and Typescript schema names.
   * By default, it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  options: Option[]
  type: 'select'
} & (
  | {
      hasMany: true
      validate?: SelectFieldManyValidation
    }
  | {
      hasMany?: false | undefined
      validate?: SelectFieldSingleValidation
    }
) &
  Omit<FieldBase, 'validate'>

export type SelectFieldClient = {
  admin?: AdminClient & Pick<SelectField['admin'], 'isClearable' | 'isSortable'>
} & FieldBaseClient &
  Pick<SelectField, 'hasMany' | 'interfaceName' | 'options' | 'type'>

type SharedRelationshipProperties = {
  filterOptions?: FilterOptions
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
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
      validate?: RelationshipFieldManyValidation
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
      validate?: RelationshipFieldSingleValidation
    }
) &
  FieldGraphQLType &
  Omit<FieldBase, 'validate'>

type SharedRelationshipPropertiesClient = FieldBaseClient &
  Pick<
    SharedRelationshipProperties,
    'hasMany' | 'max' | 'maxDepth' | 'maxRows' | 'min' | 'minRows' | 'type'
  >

type RelationshipAdmin = {
  allowCreate?: boolean
  allowEdit?: boolean
  components?: {
    afterInput?: CustomComponent[]
    beforeInput?: CustomComponent[]
    Error?: CustomComponent<
      RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent
    >
    Label?: CustomComponent<
      RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent
    >
  } & Admin['components']
  isSortable?: boolean
} & Admin

type RelationshipAdminClient = AdminClient &
  Pick<RelationshipAdmin, 'allowCreate' | 'allowEdit' | 'isSortable'>

export type PolymorphicRelationshipField = {
  admin?: {
    sortOptions?: Partial<Record<CollectionSlug, string>>
  } & RelationshipAdmin
  relationTo: CollectionSlug[]
} & SharedRelationshipProperties

export type PolymorphicRelationshipFieldClient = {
  admin?: {
    sortOptions?: Pick<PolymorphicRelationshipField['admin'], 'sortOptions'>
  } & RelationshipAdminClient
} & Pick<PolymorphicRelationshipField, 'relationTo'> &
  SharedRelationshipPropertiesClient

export type SingleRelationshipField = {
  admin?: {
    sortOptions?: string
  } & RelationshipAdmin
  relationTo: CollectionSlug
} & SharedRelationshipProperties

export type SingleRelationshipFieldClient = {
  admin?: Partial<Pick<SingleRelationshipField['admin'], 'sortOptions'>> & RelationshipAdminClient
} & Pick<SingleRelationshipField, 'relationTo'> &
  SharedRelationshipPropertiesClient

export type RelationshipField = PolymorphicRelationshipField | SingleRelationshipField

export type RelationshipFieldClient =
  | PolymorphicRelationshipFieldClient
  | SingleRelationshipFieldClient

export type ValueWithRelation = {
  relationTo: CollectionSlug
  value: number | string
}

export function valueIsValueWithRelation(value: unknown): value is ValueWithRelation {
  return value !== null && typeof value === 'object' && 'relationTo' in value && 'value' in value
}

export type RelationshipValue = RelationshipValueMany | RelationshipValueSingle

export type RelationshipValueMany = (number | string)[] | ValueWithRelation[]

export type RelationshipValueSingle = number | string | ValueWithRelation

export type RichTextField<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = {
  admin?: {
    components?: {
      Error?: CustomComponent
      Label?: CustomComponent
    } & Admin['components']
  } & Admin
  editor?:
    | RichTextAdapter<TValue, TAdapterProps, TExtraProperties>
    | RichTextAdapterProvider<TValue, TAdapterProps, TExtraProperties>
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
  type: 'richText'
} & FieldBase &
  TExtraProperties

export type RichTextFieldClient<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = FieldBaseClient &
  Pick<RichTextField<TValue, TAdapterProps, TExtraProperties>, 'maxDepth' | 'type'> &
  TExtraProperties

export type ArrayField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<ArrayFieldErrorClientComponent | ArrayFieldErrorServerComponent>
      Label?: CustomComponent<ArrayFieldLabelClientComponent | ArrayFieldLabelServerComponent>
      RowLabel?: RowLabelComponent
    } & Admin['components']
    initCollapsed?: boolean
    /**
     * Disable drag and drop sorting
     */
    isSortable?: boolean
  } & Admin
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  fields: Field[]
  /** Customize generated GraphQL and Typescript schema names.
   * By default, it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'array'
  validate?: ArrayFieldValidation
} & Omit<FieldBase, 'validate'>

export type ArrayFieldClient = {
  admin?: AdminClient & Pick<ArrayField['admin'], 'initCollapsed' | 'isSortable'>
  fields: ClientField[]
  labels?: LabelsClient
} & FieldBaseClient &
  Pick<ArrayField, 'interfaceName' | 'maxRows' | 'minRows' | 'type'>

export type RadioField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<RadioFieldErrorClientComponent | RadioFieldErrorServerComponent>
      Label?: CustomComponent<RadioFieldLabelClientComponent | RadioFieldLabelServerComponent>
    } & Admin['components']
    layout?: 'horizontal' | 'vertical'
  } & Admin
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  /**
   * Customize the DB enum name
   */
  enumName?: DBIdentifierName
  /** Customize generated GraphQL and Typescript schema names.
   * By default, it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  options: Option[]
  type: 'radio'
  validate?: RadioFieldValidation
} & Omit<FieldBase, 'validate'>

export type RadioFieldClient = {
  admin?: AdminClient & Pick<RadioField['admin'], 'layout'>
} & FieldBaseClient &
  Pick<RadioField, 'interfaceName' | 'options' | 'type'>

type BlockFields = {
  [key: string]: any
  blockName?: string
  blockType?: string
}

export type BlockJSX = {
  /**
   * Override the default regex used to search for the start of the block in the JSX.
   * By default, it's <BlockSlugHere
   */
  customEndRegex?:
    | {
        /**
         * Whether the end match is optional. If true, the end match is
         * not required to match for the transformer to be triggered.
         * The entire text from regexpStart to the end of the document will then be matched.
         */
        optional?: true
        regExp: RegExp
      }
    | RegExp
  /**
   * Override the default regex used to search for the start of the block in the JSX.
   * By default, it's <BlockSlugHere/>
   */
  customStartRegex?: RegExp
  /**
   * By default, all spaces at the beginning and end of every line of the
   * children (text between the open and close match) are removed.
   * Set this to true to disable this behavior.
   */
  doNotTrimChildren?: boolean
  /**
   * Function that receives the data for a given block and returns a JSX representation of it.
   *
   * This is used to convert Lexical => JSX
   */
  export: (props: {
    fields: BlockFields
    lexicalToMarkdown: (props: { editorState: Record<string, any> }) => string
  }) =>
    | {
        children?: string
        props?: object
      }
    | false
    | string
  /**
   * Function that receives the markdown string and parsed
   * JSX props for a given matched block and returns a Lexical representation of it.
   *
   * This is used to convert JSX => Lexical
   */
  import: (props: {
    children: string
    closeMatch: null | RegExpMatchArray // Only available when customEndRegex is set
    htmlToLexical?: ((props: { html: string }) => any) | null
    markdownToLexical: (props: { markdown: string }) => Record<string, any>
    openMatch?: RegExpMatchArray
    props: Record<string, any>
  }) => BlockFields | false
}

export type Block = {
  /**
   * Do not set this property manually. This is set to true during sanitization, to avoid
   * sanitizing the same block multiple times.
   */
  _sanitized?: boolean
  admin?: {
    components?: {
      /**
       * This will replace the entire block component, including the block header / collapsible.
       */
      Block?: PayloadComponent<any, any>
      Label?: PayloadComponent<any, any>
    }
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    /**
     * Hides the block name field from the Block's header
     *
     * @default false
     */
    disableBlockName?: boolean
    group?: Record<string, string> | string
    jsx?: PayloadComponent
  }
  /** Extension point to add your custom data. Server only. */
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
  /**
   * Preferred aspect ratio of the image is 3 : 2
   */
  imageURL?: string
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  jsx?: BlockJSX
  labels?: Labels
  slug: string
}

export type ClientBlock = {
  admin?: Pick<Block['admin'], 'custom' | 'disableBlockName' | 'group'>
  fields: ClientField[]
  labels?: LabelsClient
} & Pick<Block, 'imageAltText' | 'imageURL' | 'jsx' | 'slug'>

export type BlocksField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<BlocksFieldErrorClientComponent | BlocksFieldErrorServerComponent>
      Label?: CustomComponent<BlocksFieldLabelClientComponent | BlocksFieldLabelServerComponent>
    } & Admin['components']
    initCollapsed?: boolean
    /**
     * Disable drag and drop sorting
     */
    isSortable?: boolean
  } & Admin
  /**
   * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
   *
   * @todo `blockReferences` will be merged with `blocks` in 4.0
   */
  blockReferences?: (Block | BlockSlug)[]
  blocks: Block[]
  defaultValue?: DefaultValue
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'blocks'
  validate?: BlocksFieldValidation
} & Omit<FieldBase, 'validate'>

export type BlocksFieldClient = {
  admin?: AdminClient & Pick<BlocksField['admin'], 'initCollapsed' | 'isSortable'>
  /**
   * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
   *
   * @todo `blockReferences` will be merged with `blocks` in 4.0
   */
  blockReferences?: (ClientBlock | string)[]
  blocks: ClientBlock[]
  labels?: LabelsClient
} & FieldBaseClient &
  Pick<BlocksField, 'maxRows' | 'minRows' | 'type'>

export type PointField = {
  admin?: {
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<PointFieldErrorClientComponent | PointFieldErrorServerComponent>
      Label?: CustomComponent<PointFieldLabelClientComponent | PointFieldLabelServerComponent>
    } & Admin['components']
    placeholder?: Record<string, string> | string
    step?: number
  } & Admin
  type: 'point'
  validate?: PointFieldValidation
} & Omit<FieldBase, 'validate'>

export type PointFieldClient = {
  admin?: AdminClient & Pick<PointField['admin'], 'placeholder' | 'step'>
} & FieldBaseClient &
  Pick<PointField, 'type'>

/**
 * A virtual field that loads in related collections by querying a relationship or upload field.
 */
export type JoinField = {
  access?: {
    create?: never
    read?: FieldAccess
    update?: never
  }
  admin?: {
    allowCreate?: boolean
    components?: {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<JoinFieldErrorClientComponent | JoinFieldErrorServerComponent>
      Label?: CustomComponent<JoinFieldLabelClientComponent | JoinFieldLabelServerComponent>
    } & Admin['components']
    defaultColumns?: string[]
    disableBulkEdit?: never
    readOnly?: never
  } & Admin
  /**
   * The slug of the collection to relate with.
   */
  collection: CollectionSlug | CollectionSlug[]
  defaultLimit?: number
  defaultSort?: Sort
  defaultValue?: never
  /**
   * This does not need to be set and will be overridden by the relationship field's hasMany property.
   */
  hasMany?: boolean
  hidden?: false
  index?: never
  /**
   * This does not need to be set and will be overridden by the relationship field's localized property.
   */
  localized?: boolean
  /**
   * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
   *
   * @see https://payloadcms.com/docs/getting-started/concepts#depth
   *
   * @default 1
   */
  maxDepth?: number
  /**
   * A string for the field in the collection being joined to.
   */
  on: string
  /**
   * If true, enables custom ordering for the collection with the relationship, and joined documents can be reordered via drag and drop.
   * New documents are inserted at the end of the list according to this parameter.
   *
   * Under the hood, a field with {@link https://observablehq.com/@dgreensp/implementing-fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
   *
   * @default false
   *
   * @experimental There may be frequent breaking changes to this API
   */
  orderable?: boolean
  sanitizedMany?: JoinField[]
  type: 'join'
  validate?: never
  where?: Where
} & FieldBase &
  FieldGraphQLType

export type JoinFieldClient = {
  admin?: AdminClient &
    Pick<JoinField['admin'], 'allowCreate' | 'defaultColumns' | 'disableBulkEdit' | 'readOnly'>
} & { targetField: Pick<RelationshipFieldClient, 'relationTo'> } & FieldBaseClient &
  Pick<
    JoinField,
    | 'collection'
    | 'defaultLimit'
    | 'defaultSort'
    | 'index'
    | 'maxDepth'
    | 'on'
    | 'orderable'
    | 'type'
    | 'where'
  >

export type FlattenedBlock = {
  flattenedFields: FlattenedField[]
} & Block

export type FlattenedBlocksField = {
  /**
   * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
   *
   * @todo `blockReferences` will be merged with `blocks` in 4.0
   */
  blockReferences?: (FlattenedBlock | string)[]
  blocks: FlattenedBlock[]
} & Omit<BlocksField, 'blockReferences' | 'blocks'>

export type FlattenedGroupField = {
  flattenedFields: FlattenedField[]
} & GroupField

export type FlattenedArrayField = {
  flattenedFields: FlattenedField[]
} & ArrayField

export type FlattenedTabAsField = {
  flattenedFields: FlattenedField[]
} & MarkRequired<TabAsField, 'name'>

export type FlattenedJoinField = {
  targetField: RelationshipField | UploadField
} & JoinField

export type FlattenedField =
  | CheckboxField
  | CodeField
  | DateField
  | EmailField
  | FlattenedArrayField
  | FlattenedBlocksField
  | FlattenedGroupField
  | FlattenedJoinField
  | FlattenedTabAsField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | SelectField
  | TextareaField
  | TextField
  | UploadField
export type Field =
  | ArrayField
  | BlocksField
  | CheckboxField
  | CodeField
  | CollapsibleField
  | DateField
  | EmailField
  | GroupField
  | JoinField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | RowField
  | SelectField
  | TabsField
  | TextareaField
  | TextField
  | UIField
  | UploadField

export type ClientField =
  | ArrayFieldClient
  | BlocksFieldClient
  | CheckboxFieldClient
  | CodeFieldClient
  | CollapsibleFieldClient
  | DateFieldClient
  | EmailFieldClient
  | GroupFieldClient
  | JoinFieldClient
  | JSONFieldClient
  | NumberFieldClient
  | PointFieldClient
  | RadioFieldClient
  | RelationshipFieldClient
  | RichTextFieldClient
  | RowFieldClient
  | SelectFieldClient
  | TabsFieldClient
  | TextareaFieldClient
  | TextFieldClient
  | UIFieldClient
  | UploadFieldClient

export type ClientFieldProps =
  | ArrayFieldClientProps
  | BlocksFieldClientProps
  | CheckboxFieldClientProps
  | CodeFieldClientProps
  | CollapsibleFieldClientProps
  | DateFieldClientProps
  | EmailFieldClientProps
  | GroupFieldClientProps
  | HiddenFieldProps
  | JoinFieldClientProps
  | JSONFieldClientProps
  | NumberFieldClientProps
  | PointFieldClientProps
  | RadioFieldClientProps
  | RelationshipFieldClientProps
  | RichTextFieldClientProps
  | RowFieldClientProps
  | SelectFieldClientProps
  | TabsFieldClientProps
  | TextareaFieldClientProps
  | TextFieldClientProps
  | UploadFieldClientProps

type ExtractFieldTypes<T> = T extends { type: infer U } ? U : never

export type FieldTypes = ExtractFieldTypes<Field>

export type FieldAffectingData =
  | ArrayField
  | BlocksField
  | CheckboxField
  | CodeField
  | DateField
  | EmailField
  | GroupField
  | JoinField
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | SelectField
  | TabAsField
  | TextareaField
  | TextField
  | UploadField

export type FieldAffectingDataClient =
  | ArrayFieldClient
  | BlocksFieldClient
  | CheckboxFieldClient
  | CodeFieldClient
  | DateFieldClient
  | EmailFieldClient
  | GroupFieldClient
  | JoinFieldClient
  | JSONFieldClient
  | NumberFieldClient
  | PointFieldClient
  | RadioFieldClient
  | RelationshipFieldClient
  | RichTextFieldClient
  | SelectFieldClient
  | TabAsFieldClient
  | TextareaFieldClient
  | TextFieldClient
  | UploadFieldClient

export type NonPresentationalField =
  | ArrayField
  | BlocksField
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
  | TextareaField
  | TextField
  | UploadField

export type NonPresentationalFieldClient =
  | ArrayFieldClient
  | BlocksFieldClient
  | CheckboxFieldClient
  | CodeFieldClient
  | CollapsibleFieldClient
  | DateFieldClient
  | EmailFieldClient
  | GroupFieldClient
  | JSONFieldClient
  | NumberFieldClient
  | PointFieldClient
  | RadioFieldClient
  | RelationshipFieldClient
  | RichTextFieldClient
  | RowFieldClient
  | SelectFieldClient
  | TabsFieldClient
  | TextareaFieldClient
  | TextFieldClient
  | UploadFieldClient

export type FieldWithPath = {
  path?: string
} & Field

export type FieldWithPathClient = {
  path?: string
} & ClientField

export type FieldWithSubFields = ArrayField | CollapsibleField | GroupField | RowField

export type FieldWithSubFieldsClient =
  | ArrayFieldClient
  | CollapsibleFieldClient
  | GroupFieldClient
  | RowFieldClient

export type FieldPresentationalOnly = UIField
export type FieldPresentationalOnlyClient = UIFieldClient

export type FieldWithMany = RelationshipField | SelectField
export type FieldWithManyClient = RelationshipFieldClient | SelectFieldClient

export type FieldWithMaxDepth = RelationshipField | UploadField
export type FieldWithMaxDepthClient = JoinFieldClient | RelationshipFieldClient | UploadFieldClient

export function fieldHasSubFields<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? FieldWithSubFieldsClient : FieldWithSubFields) {
  return (
    field.type === 'group' ||
    field.type === 'array' ||
    field.type === 'row' ||
    field.type === 'collapsible'
  )
}

export function fieldIsArrayType<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? ArrayFieldClient : ArrayField) {
  return field.type === 'array'
}

export function fieldIsBlockType<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? BlocksFieldClient : BlocksField) {
  return field.type === 'blocks'
}

export function fieldIsGroupType<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? GroupFieldClient : GroupField) {
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

export function fieldSupportsMany<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? FieldWithManyClient : FieldWithMany) {
  return field.type === 'select' || field.type === 'relationship' || field.type === 'upload'
}

export function fieldHasMaxDepth<TField extends ClientField | Field>(
  field: TField,
): field is TField & (TField extends ClientField ? FieldWithMaxDepthClient : FieldWithMaxDepth) {
  return (
    (field.type === 'upload' || field.type === 'relationship' || field.type === 'join') &&
    typeof field.maxDepth === 'number'
  )
}

export function fieldIsPresentationalOnly<
  TField extends ClientField | Field | TabAsField | TabAsFieldClient,
>(
  field: TField,
): field is TField & (TField extends ClientField | TabAsFieldClient ? UIFieldClient : UIField) {
  return field.type === 'ui'
}

export function fieldIsSidebar<TField extends ClientField | Field | TabAsField | TabAsFieldClient>(
  field: TField,
): field is { admin: { position: 'sidebar' } } & TField {
  return 'admin' in field && 'position' in field.admin && field.admin.position === 'sidebar'
}

export function fieldIsID<TField extends ClientField | Field>(
  field: TField,
): field is { name: 'id' } & TField {
  return 'name' in field && field.name === 'id'
}

export function fieldIsHiddenOrDisabled<
  TField extends ClientField | Field | TabAsField | TabAsFieldClient,
>(field: TField): field is { admin: { hidden: true } } & TField {
  return (
    ('hidden' in field && field.hidden) ||
    ('admin' in field && 'disabled' in field.admin && field.admin.disabled)
  )
}

export function fieldAffectsData<
  TField extends ClientField | Field | TabAsField | TabAsFieldClient,
>(
  field: TField,
): field is TField &
  (TField extends ClientField | TabAsFieldClient ? FieldAffectingDataClient : FieldAffectingData) {
  return 'name' in field && !fieldIsPresentationalOnly(field)
}

export function tabHasName<TField extends ClientTab | Tab>(tab: TField): tab is NamedTab & TField {
  return 'name' in tab
}

/**
 * Check if a field has localized: true set. This does not check if a field *should*
 * be localized. To check if a field should be localized, use `fieldShouldBeLocalized`.
 *
 * @deprecated this will be removed or modified in v4.0, as `fieldIsLocalized` can easily lead to bugs due to
 * parent field localization not being taken into account.
 */
export function fieldIsLocalized(field: Field | Tab): boolean {
  return 'localized' in field && field.localized
}

/**
 * Similar to `fieldIsLocalized`, but returns `false` if any parent field is localized.
 */
export function fieldShouldBeLocalized({
  field,
  parentIsLocalized,
}: {
  field: ClientField | ClientTab | Field | Tab
  parentIsLocalized: boolean
}): boolean {
  return (
    'localized' in field &&
    field.localized &&
    (!parentIsLocalized ||
      process.env.NEXT_PUBLIC_PAYLOAD_COMPATIBILITY_allowLocalizedWithinLocalized === 'true')
  )
}

export function fieldIsVirtual(field: Field | Tab): boolean {
  return 'virtual' in field && field.virtual
}

export type HookName =
  | 'afterChange'
  | 'afterRead'
  | 'beforeChange'
  | 'beforeRead'
  | 'beforeValidate'
