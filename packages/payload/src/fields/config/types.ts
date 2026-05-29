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
  Data,
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
  Timezone,
  TimezonesConfig,
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
  FieldCustom,
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
  PickPreserveOptional,
  Where,
} from '../../types/index.js'
import type { DisabledOptions } from '../isFieldDisabled.js'
import type {
  NumberFieldManyValidation,
  NumberFieldSingleValidation,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
  RichTextFieldValidation,
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
  previousSiblingDoc?: TSiblingData
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
    operation,
    path,
    user,
  }: {
    /**
     * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
     */
    blockData: Partial<TData>
    /**
     * A string relating to which operation the field type is currently executing within.
     */
    operation: Operation
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

export type FilterOptions<TData = any> = FilterOptionsFunc<TData> | null | Where

type BlockSlugOrString = (BlockSlug | (string & {}))[]

export type BlocksFilterOptionsProps<TData = any> = Pick<
  FilterOptionsProps<TData>,
  'data' | 'req' | 'siblingData' | 'user'
> & {
  /**
   * The `id` of the current document being edited. Will be undefined during the `create` operation.
   */
  id: number | string
}

export type BlocksFilterOptions<TData = any> =
  | ((
      options: BlocksFilterOptionsProps<TData>,
    ) => BlockSlugOrString | Promise<BlockSlugOrString | true> | true)
  | BlockSlugOrString

export type FieldPosition = 'main' | 'sidebar'

export type FieldAdmin = {
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
  /**
   * Controls where this field is disabled in the admin UI.
   * - `true` disables the field everywhere (edit form, list column, list filter, groupBy, bulk edit).
   * - An object enables granular control per area: `{ field?, column?, filter?, groupBy?, bulkEdit? }`.
   */
  disabled?: boolean | DisabledOptions
  hidden?: boolean
  position?: FieldPosition
  readOnly?: boolean
  style?: CSSProperties
  width?: CSSProperties['width']
}

export type AdminClient = {
  className?: string
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
  description?: StaticDescription
  /**
   * Controls where this field is disabled in the admin UI.
   * - `true` disables the field everywhere (edit form, list column, list filter, groupBy, bulk edit).
   * - An object enables granular control per area: `{ field?, column?, filter?, groupBy?, bulkEdit? }`.
   */
  disabled?: boolean | DisabledOptions
  hidden?: boolean
  position?: FieldPosition
  readOnly?: boolean
  style?: CSSProperties & { '--field-width'?: CSSProperties['width'] }
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
   * The data of the nearest parent block. If the field is not within a block, `blockData` will be equal to `undefined`.
   */
  blockData: Partial<TData>
  collectionSlug?: string
  data: Partial<TData>
  event?: 'onChange' | 'submit'
  id?: number | string
  operation?: Operation
  /**
   * The `overrideAccess` flag that was attached to the request. This is used to bypass access control checks for fields.
   */
  overrideAccess?: boolean
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
  admin?: FieldAdmin
  /** Extension point to add your custom data. Server only. */
  custom?: FieldCustom
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
  /**
   * Allows you to modify the base JSON schema that is generated for this field.
   * This JSON schema will be used to generate the TypeScript interface of this field, and to
   * validate the field's value in the MCP plugin.
   */
  jsonSchema?: Array<(args: { jsonSchema: JSONSchema4 }) => JSONSchema4>
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
  unique?: boolean
  validate?: Validate
  /**
   * Pass `true` to disable field in the DB
   * for [Virtual Fields](https://payloadcms.com/blog/learn-how-virtual-fields-can-help-solve-common-cms-challenges):
   * A virtual field can be used in `admin.useAsTitle` only when linked to a relationship.
   */
  virtual?: boolean | string
}

export interface FieldBaseClient
  extends Pick<
    FieldBase,
    'hidden' | 'index' | 'jsonSchema' | 'localized' | 'name' | 'required' | 'saveToJWT' | 'unique'
  > {
  admin?: AdminClient
  label?: StaticLabel
}

export type NumberField = Omit<FieldBase, 'validate'> &
  (
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
  ) & {
    admin?: FieldAdmin & {
      /** Set this property to a string that will be used for browser autocomplete. */
      autoComplete?: string
      components?: FieldAdmin['components'] & {
        afterInput?: CustomComponent[]
        beforeInput?: CustomComponent[]
        Error?: CustomComponent<NumberFieldErrorClientComponent | NumberFieldErrorServerComponent>
        Label?: CustomComponent<NumberFieldLabelClientComponent | NumberFieldLabelServerComponent>
      }
      /** Set this property to define a placeholder string for the field. */
      placeholder?: Record<string, string> | string
      /** Set a value for the number field to increment / decrement using browser controls. */
      step?: number
    }
    /** Maximum value accepted. Used in the default `validate` function. */
    max?: number
    /** Minimum value accepted. Used in the default `validate` function. */
    min?: number
    type: 'number'
  }

export type NumberFieldClient = FieldBaseClient &
  Pick<NumberField, 'hasMany' | 'max' | 'maxRows' | 'min' | 'minRows' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<NumberField['admin'], 'autoComplete' | 'placeholder' | 'step'>
  }

export type TextField = Omit<FieldBase, 'validate'> &
  (
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
  ) & {
    admin?: FieldAdmin & {
      autoComplete?: string
      components?: FieldAdmin['components'] & {
        afterInput?: CustomComponent[]
        beforeInput?: CustomComponent[]
        Error?: CustomComponent<TextFieldErrorClientComponent | TextFieldErrorServerComponent>
        Label?: CustomComponent<TextFieldLabelClientComponent | TextFieldLabelServerComponent>
      }
      placeholder?: Record<string, string> | string
      rtl?: boolean
    }
    maxLength?: number
    minLength?: number
    type: 'text'
  }

export type TextFieldClient = FieldBaseClient &
  Pick<TextField, 'hasMany' | 'maxLength' | 'maxRows' | 'minLength' | 'minRows' | 'type'> & {
    admin?: AdminClient &
      PickPreserveOptional<NonNullable<TextField['admin']>, 'autoComplete' | 'placeholder' | 'rtl'>
  }

export type EmailField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    autoComplete?: string
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<EmailFieldErrorClientComponent | EmailFieldErrorServerComponent>
      Label?: CustomComponent<EmailFieldLabelClientComponent | EmailFieldLabelServerComponent>
    }
    placeholder?: Record<string, string> | string
  }
  type: 'email'
  validate?: EmailFieldValidation
}

export type EmailFieldClient = FieldBaseClient &
  Pick<EmailField, 'type'> & {
    admin?: AdminClient &
      PickPreserveOptional<NonNullable<EmailField['admin']>, 'autoComplete' | 'placeholder'>
  }

export type TextareaField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<TextareaFieldErrorClientComponent | TextareaFieldErrorServerComponent>
      Label?: CustomComponent<TextareaFieldLabelClientComponent | TextareaFieldLabelServerComponent>
    }
    placeholder?: Record<string, string> | string
    rows?: number
    rtl?: boolean
  }
  maxLength?: number
  minLength?: number
  type: 'textarea'
  validate?: TextareaFieldValidation
}

export type TextareaFieldClient = FieldBaseClient &
  Pick<TextareaField, 'maxLength' | 'minLength' | 'type'> & {
    admin?: AdminClient &
      PickPreserveOptional<NonNullable<TextareaField['admin']>, 'placeholder' | 'rows' | 'rtl'>
  }

export type CheckboxField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<CheckboxFieldErrorClientComponent | CheckboxFieldErrorServerComponent>
      Label?: CustomComponent<CheckboxFieldLabelClientComponent | CheckboxFieldLabelServerComponent>
    }
  }
  type: 'checkbox'
  validate?: CheckboxFieldValidation
}

export type CheckboxFieldClient = FieldBaseClient &
  Pick<CheckboxField, 'type'> & {
    admin?: AdminClient
  }

type DateFieldTimezoneConfigBase = Pick<TimezonesConfig, 'defaultTimezone'> & {
  /**
   * Make only the timezone required in the admin interface. This means a timezone is always required to be selected.
   */
  required?: boolean
  supportedTimezones?: Timezone[]
}

type DateFieldTimezoneConfig = DateFieldTimezoneConfigBase & {
  /**
   * A function used to override the timezone field at a granular level.
   * Passes the base select field to you to manipulate beyond the exposed options.
   * @example
   * ```ts
   * {
   *   type: 'date',
   *   name: 'publishedAt',
   *   timezone: {
   *     override: ({ baseField }) => ({
   *       ...baseField,
   *       admin: {
   *         ...baseField.admin,
   *         hidden: false,
   *       },
   *     }),
   *   },
   * }
   * ```
   */
  override?: (args: { baseField: SelectField }) => Field
}

type DateFieldTimezoneConfigClient = DateFieldTimezoneConfigBase

export type DateField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<DateFieldErrorClientComponent | DateFieldErrorServerComponent>
      Label?: CustomComponent<DateFieldLabelClientComponent | DateFieldLabelServerComponent>
    }
    date?: ConditionalDateProps
    placeholder?: Record<string, string> | string
  }
  /**
   * Enable timezone selection in the admin interface.
   */
  timezone?: DateFieldTimezoneConfig | true
  type: 'date'
  validate?: DateFieldValidation
}

export type DateFieldClient = FieldBaseClient &
  Pick<DateField, 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<DateField['admin'], 'date' | 'placeholder'>
    /**
     * Enable timezone selection in the admin interface.
     * Note: The `override` function is stripped on the client.
     */
    timezone?: DateFieldTimezoneConfigClient | true
  }

export type GroupBase = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Label?: CustomComponent<GroupFieldLabelClientComponent | GroupFieldLabelServerComponent>
    }
    hideGutter?: boolean
  }
  fields: Field[]
  type: 'group'
  validate?: Validate<unknown, unknown, unknown, GroupField>
}

export type NamedGroupField = GroupBase & {
  /** Customize generated GraphQL and Typescript schema names.
   * By default, it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type UnnamedGroupField = Omit<GroupBase, 'hooks' | 'name' | 'virtual'> & {
  interfaceName?: never
  localized?: never
}

export type GroupField = NamedGroupField | UnnamedGroupField

export type UnnamedGroupFieldClient = Omit<FieldBaseClient, 'name' | 'required'> &
  Pick<UnnamedGroupField, 'label' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<UnnamedGroupField['admin'], 'hideGutter'>
    fields: ClientField[]
  }

export type NamedGroupFieldClient = Pick<NamedGroupField, 'name'> & UnnamedGroupFieldClient

export type GroupFieldClient = NamedGroupFieldClient | UnnamedGroupFieldClient

export type RowField = Omit<
  FieldBase,
  'admin' | 'hooks' | 'label' | 'localized' | 'name' | 'validate' | 'virtual'
> & {
  admin?: Omit<FieldAdmin, 'description'>
  fields: Field[]
  type: 'row'
}

export type RowFieldClient = Omit<FieldBaseClient, 'admin' | 'label' | 'name'> &
  Pick<RowField, 'type'> & {
    admin?: Omit<AdminClient, 'description'>
    fields: ClientField[]
  }

export type CollapsibleField = Omit<
  FieldBase,
  'hooks' | 'label' | 'localized' | 'name' | 'validate' | 'virtual'
> &
  (
    | {
        admin: FieldAdmin & {
          components: FieldAdmin['components'] & {
            afterInput?: CustomComponent[]
            beforeInput?: CustomComponent[]
            Label: CustomComponent<
              CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent
            >
          }
          initCollapsed?: boolean
        }
        label?: Required<FieldBase['label']>
      }
    | {
        admin?: FieldAdmin & {
          components?: FieldAdmin['components'] & {
            afterInput?: CustomComponent[]
            beforeInput?: CustomComponent[]
            Label?: CustomComponent<
              CollapsibleFieldLabelClientComponent | CollapsibleFieldLabelServerComponent
            >
          }
          initCollapsed?: boolean
        }
        label: Required<FieldBase['label']>
      }
  ) & {
    fields: Field[]
    type: 'collapsible'
  }

export type CollapsibleFieldClient = Omit<FieldBaseClient, 'label' | 'name' | 'validate'> &
  Pick<CollapsibleField, 'type'> & {
    admin?: AdminClient & {
      initCollapsed?: boolean
    }
    fields: ClientField[]
    label: StaticLabel
  }

type TabBase = Omit<FieldBase, 'required' | 'validate'> & {
  /**
   * @deprecated
   * Use `admin.description` instead. This will be removed in a future major version.
   */
  description?: LabelFunction | StaticDescription
  fields: Field[]
  // TODO: Deprecate this in favor of a schemaPath property on every field
  id?: string
  interfaceName?: string
  saveToJWT?: boolean | string
}

export type NamedTab = TabBase & {
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type UnnamedTab = Omit<TabBase, 'hooks' | 'name' | 'virtual'> & {
  interfaceName?: never
  /**
   * Can be either:
   * - A string, which will be used as the tab's label.
   * - An object, where the key is the language code and the value is the label.
   */
  label:
    | LabelFunction
    | string
    | {
        [selectedLanguage: string]: string
      }
  localized?: never
}

export type Tab = NamedTab | UnnamedTab
export type TabsField = Omit<
  FieldBase,
  'admin' | 'localized' | 'name' | 'saveToJWT' | 'virtual'
> & {
  admin?: Omit<FieldAdmin, 'description'>
  type: 'tabs'
} & {
  tabs: Tab[]
}

export type TabsFieldClient = Omit<FieldBaseClient, 'admin' | 'localized' | 'name' | 'saveToJWT'> &
  Pick<TabsField, 'type'> & {
    admin?: Omit<AdminClient, 'description'>
    tabs: ClientTab[]
  }

export type TabAsField = Tab & {
  name?: string
  type: 'tab'
}

export type TabAsFieldClient = ClientTab & Pick<TabAsField, 'name' | 'type'>

export type UIField = {
  admin: {
    components?: FieldAdmin['components'] & {
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
    }
    condition?: Condition
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    /**
     * Controls where this UI field is disabled in the admin UI.
     * - `true` disables the field everywhere.
     * - An object enables granular control per area: `{ field?, column?, filter?, groupBy?, bulkEdit? }`.
     * UI fields default to `disabled: { bulkEdit: true }` via sanitize.
     */
    disabled?: boolean | DisabledOptions
    position?: string
    width?: CSSProperties['width']
  }
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  label?: Record<string, string> | string
  name: string
  type: 'ui'
}

export type UIFieldClient = Omit<DeepUndefinable<FieldBaseClient>, 'admin'> &
  Pick<UIField, 'label' | 'name' | 'type'> & {
    // still include FieldBaseClient (even if it's undefinable) so that we don't need constant type checks (e.g. if('xy' in field))
    // still include FieldBaseClient.admin (even if it's undefinable) so that we don't need constant type checks (e.g. if('xy' in field))

    admin: DeepUndefinable<FieldBaseClient['admin']> &
      Pick<UIField['admin'], 'custom' | 'disabled' | 'position' | 'width'>
  }

type SharedUploadProperties = FieldGraphQLType &
  Omit<FieldBase, 'validate'> & {
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
        maxRows?: number
        minRows?: number
        validate?: UploadFieldManyValidation
      }
    | {
        hasMany?: false | undefined
        maxRows?: undefined
        minRows?: undefined
        validate?: UploadFieldSingleValidation
      }
  )

type SharedUploadPropertiesClient = FieldBaseClient &
  Pick<SharedUploadProperties, 'hasMany' | 'maxDepth' | 'maxRows' | 'minRows' | 'type'>

type UploadAdmin = FieldAdmin & {
  allowCreate?: boolean
  components?: FieldAdmin['components'] & {
    afterInput?: CustomComponent[]
    beforeInput?: CustomComponent[]
    Error?: CustomComponent<
      RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent
    >
    Label?: CustomComponent<
      RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent
    >
  }
  isSortable?: boolean
}

type UploadAdminClient = AdminClient & Pick<UploadAdmin, 'allowCreate' | 'isSortable'>

export type PolymorphicUploadField = SharedUploadProperties & {
  admin?: UploadAdmin & {
    sortOptions?: Partial<Record<CollectionSlug, string>>
  }
  /**
   * @todo v4: make relationTo: [] fail type checking
   */
  relationTo: CollectionSlug[]
}

export type PolymorphicUploadFieldClient = Pick<
  PolymorphicUploadField,
  'displayPreview' | 'maxDepth' | 'relationTo' | 'type'
> &
  SharedUploadPropertiesClient & {
    admin?: UploadAdminClient & {
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      sortOptions?: Pick<PolymorphicUploadField['admin'], 'sortOptions'>
    }
  }

export type SingleUploadField = SharedUploadProperties & {
  admin?: UploadAdmin & {
    sortOptions?: string
  }
  relationTo: CollectionSlug
}

export type SingleUploadFieldClient = Pick<
  SingleUploadField,
  'displayPreview' | 'maxDepth' | 'relationTo' | 'type'
> &
  SharedUploadPropertiesClient & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: Pick<SingleUploadField['admin'], 'sortOptions'> & UploadAdminClient
  }

export type UploadField = PolymorphicUploadField | SingleUploadField

export type UploadFieldClient = PolymorphicUploadFieldClient | SingleUploadFieldClient

export type CodeField = Omit<FieldBase, 'admin' | 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<CodeFieldErrorClientComponent | CodeFieldErrorServerComponent>
      Label?: CustomComponent<CodeFieldLabelClientComponent | CodeFieldLabelServerComponent>
    }
    editorOptions?: EditorProps['options']
    editorProps?: Partial<EditorProps>
    language?: string
  }
  maxLength?: number
  minLength?: number
  type: 'code'
  validate?: CodeFieldValidation
}

export type CodeFieldClient = Omit<FieldBaseClient, 'admin'> &
  Pick<CodeField, 'maxLength' | 'minLength' | 'type'> & {
    admin?: AdminClient &
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      Partial<Pick<CodeField['admin'], 'editorOptions' | 'editorProps' | 'language'>>
  }

export type JSONField = Omit<FieldBase, 'admin' | 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<JSONFieldErrorClientComponent | JSONFieldErrorServerComponent>
      Label?: CustomComponent<JSONFieldLabelClientComponent | JSONFieldLabelServerComponent>
    }
    editorOptions?: EditorProps['options']
    maxHeight?: number
  }

  jsonSchema?: {
    fileMatch: string[]
    schema: JSONSchema4
    uri: string
  }
  type: 'json'
  validate?: JSONFieldValidation
}

export type JSONFieldClient = Omit<FieldBaseClient, 'admin'> &
  Pick<JSONField, 'jsonSchema' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<JSONField['admin'], 'editorOptions' | 'maxHeight'>
  }

export type SelectField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<SelectFieldErrorClientComponent | SelectFieldErrorServerComponent>
      Label?: CustomComponent<SelectFieldLabelClientComponent | SelectFieldLabelServerComponent>
    }
    isClearable?: boolean
    isSortable?: boolean
    placeholder?: LabelFunction | string
  }
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  /**
   * Customize the DB enum name
   */
  enumName?: DBIdentifierName
  /**
   * Reduce the available options based on the current user, value of another field, etc.
   * Similar to the `filterOptions` property on `relationship` and `upload` fields, except with a different return type.
   */
  filterOptions?: (args: {
    data: Data
    options: Option[]
    req: PayloadRequest
    siblingData: Data
  }) => Option[]
  hasMany?: boolean
  /**
   * Customize generated GraphQL and Typescript schema names.
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
  )

export type SelectFieldClient = FieldBaseClient &
  Pick<SelectField, 'hasMany' | 'interfaceName' | 'options' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<SelectField['admin'], 'isClearable' | 'isSortable' | 'placeholder'>
  }

type SharedRelationshipProperties = FieldGraphQLType &
  Omit<FieldBase, 'validate'> & {
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
        maxRows?: number
        minRows?: number
        validate?: RelationshipFieldManyValidation
      }
    | {
        hasMany?: false | undefined
        maxRows?: undefined
        minRows?: undefined
        validate?: RelationshipFieldSingleValidation
      }
  )

type SharedRelationshipPropertiesClient = FieldBaseClient &
  Pick<SharedRelationshipProperties, 'hasMany' | 'maxDepth' | 'maxRows' | 'minRows' | 'type'>

type RelationshipAdmin = FieldAdmin & {
  allowCreate?: boolean
  allowEdit?: boolean
  appearance?: 'drawer' | 'select'
  components?: FieldAdmin['components'] & {
    afterInput?: CustomComponent[]
    beforeInput?: CustomComponent[]
    Error?: CustomComponent<
      RelationshipFieldErrorClientComponent | RelationshipFieldErrorServerComponent
    >
    Label?: CustomComponent<
      RelationshipFieldLabelClientComponent | RelationshipFieldLabelServerComponent
    >
  }
  isSortable?: boolean
  placeholder?: LabelFunction | string
}

type RelationshipAdminClient = AdminClient &
  Pick<RelationshipAdmin, 'allowCreate' | 'allowEdit' | 'appearance' | 'isSortable' | 'placeholder'>

export type PolymorphicRelationshipField = SharedRelationshipProperties & {
  admin?: RelationshipAdmin & {
    sortOptions?: Partial<Record<CollectionSlug, string>>
  }
  /**
   * @todo v4: make relationTo: [] fail type checking
   */
  relationTo: CollectionSlug[]
}

export type PolymorphicRelationshipFieldClient = Pick<PolymorphicRelationshipField, 'relationTo'> &
  SharedRelationshipPropertiesClient & {
    admin?: RelationshipAdminClient & {
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      sortOptions?: PolymorphicRelationshipField['admin']['sortOptions']
    }
  }

export type SingleRelationshipField = SharedRelationshipProperties & {
  admin?: RelationshipAdmin & {
    sortOptions?: string
  }
  relationTo: CollectionSlug
}

export type SingleRelationshipFieldClient = Pick<SingleRelationshipField, 'relationTo'> &
  SharedRelationshipPropertiesClient & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: Partial<Pick<SingleRelationshipField['admin'], 'sortOptions'>> & RelationshipAdminClient
  }

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
> = Omit<FieldBase, 'validate'> &
  TExtraProperties & {
    admin?: FieldAdmin & {
      components?: FieldAdmin['components'] & {
        afterInput?: CustomComponent[]
        beforeInput?: CustomComponent[]
        Error?: CustomComponent
        Label?: CustomComponent
      }
    }
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
    validate?: RichTextFieldValidation
  }

export type RichTextFieldClient<
  TValue extends object = any,
  TAdapterProps = any,
  TExtraProperties = object,
> = FieldBaseClient &
  Pick<RichTextField<TValue, TAdapterProps, TExtraProperties>, 'maxDepth' | 'type'> &
  TExtraProperties

export type ArrayField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<ArrayFieldErrorClientComponent | ArrayFieldErrorServerComponent>
      Label?: CustomComponent<ArrayFieldLabelClientComponent | ArrayFieldLabelServerComponent>
      RowLabel?: RowLabelComponent
    }
    initCollapsed?: boolean
    /**
     * Disable drag and drop sorting
     */
    isSortable?: boolean
  }
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
}

export type ArrayFieldClient = FieldBaseClient &
  Pick<ArrayField, 'interfaceName' | 'maxRows' | 'minRows' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<ArrayField['admin'], 'initCollapsed' | 'isSortable'>
    fields: ClientField[]
    labels?: LabelsClient
  }

export type RadioField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<RadioFieldErrorClientComponent | RadioFieldErrorServerComponent>
      Label?: CustomComponent<RadioFieldLabelClientComponent | RadioFieldLabelServerComponent>
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
}

export type RadioFieldClient = FieldBaseClient &
  Pick<RadioField, 'interfaceName' | 'options' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<RadioField['admin'], 'layout'>
  }

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
    | RegExp
    | {
        /**
         * Whether the end match is optional. If true, the end match is
         * not required to match for the transformer to be triggered.
         * The entire text from regexpStart to the end of the document will then be matched.
         */
        optional?: true
        regExp: RegExp
      }
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
    | false
    | string
    | {
        children?: string
        props?: object
      }
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
    /**
     * Custom images for the block displayed in different UI contexts.
     *
     * @example
     * // Using string URLs (simplest form)
     * images: {
     *   icon: 'https://example.com/icon.svg',
     *   thumbnail: 'https://example.com/thumbnail.jpg',
     * }
     *
     * @example
     * // Using objects with alt text
     * images: {
     *   icon: { url: 'https://example.com/icon.svg', alt: 'Quote icon' },
     *   thumbnail: { url: 'https://example.com/thumb.jpg', alt: 'Quote block thumbnail' },
     * }
     */
    images?: {
      /**
       * Icon image for the block in Lexical editor menus and toolbars (displayed at 20x20px).
       * Use square images or SVGs for best results.
       * Can be a URL string or an object with `url` and optional `alt` properties.
       */
      icon?: string | { alt?: string; url: string }
      /**
       * Thumbnail image for the block in the Admin UI block selection drawer.
       * Preferred aspect ratio is 3:2 (e.g., 480x320, 600x400).
       * Can be a URL string or an object with `url` and optional `alt` properties.
       */
      thumbnail?: string | { alt?: string; url: string }
    }
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
  /**
   * @deprecated Use `admin.images` instead.
   */
  imageAltText?: string

  /**
   * @deprecated Use `admin.images` instead. Preferred aspect ratio of the image is 3:2.
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

export type ClientBlock = Pick<Block, 'imageAltText' | 'imageURL' | 'jsx' | 'slug'> & {
  admin?: Pick<NonNullable<Block['admin']>, 'custom' | 'disableBlockName' | 'group' | 'images'>
  fields: ClientField[]
  labels?: LabelsClient
}

export type BlocksField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<BlocksFieldErrorClientComponent | BlocksFieldErrorServerComponent>
      Label?: CustomComponent<BlocksFieldLabelClientComponent | BlocksFieldLabelServerComponent>
    }
    initCollapsed?: boolean
    /**
     * Disable drag and drop sorting
     */
    isSortable?: boolean
  }
  /**
   * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
   *
   * @todo `blockReferences` will be merged with `blocks` in 4.0
   */
  blockReferences?: (Block | BlockSlug)[]
  blocks: Block[]
  defaultValue?: DefaultValue
  /**
   * Blocks can be conditionally enabled using the `filterOptions` property on the blocks field.
   * It allows you to provide a function that returns which block slugs should be available based on the given context.
   *
   * @behavior
   *
   * - `filterOptions` is re-evaluated as part of the form state request, whenever the document data changes.
   * - If a block is present in the field but no longer allowed by `filterOptions`, a validation error will occur when saving.
   *
   * @example
   *
   * ```ts
   * {
   *   name: 'blocksWithDynamicFilterOptions',
   *   type: 'blocks',
   *   filterOptions: ({ siblingData }) => {
   *     return siblingData?.enabledBlocks?.length
   *       ? [siblingData.enabledBlocks] // allow only the matching block
   *       : true // allow all blocks if no value is set
   *   },
   *   blocks: [
   *     { slug: 'block1', fields: [{ type: 'text', name: 'block1Text' }] },
   *     { slug: 'block2', fields: [{ type: 'text', name: 'block2Text' }] },
   *     { slug: 'block3', fields: [{ type: 'text', name: 'block3Text' }] },
   *   ],
   * }
   * ```
   * In this example, the list of available blocks is determined by the enabledBlocks sibling field. If no value is set, all blocks remain available.
   */
  filterOptions?: BlocksFilterOptions
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'blocks'
  validate?: BlocksFieldValidation
}

export type BlocksFieldClient = FieldBaseClient &
  Pick<BlocksField, 'maxRows' | 'minRows' | 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<BlocksField['admin'], 'initCollapsed' | 'isSortable'>
    /**
     * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
     *
     * @todo `blockReferences` will be merged with `blocks` in 4.0
     */
    blockReferences?: (ClientBlock | string)[]
    blocks: ClientBlock[]
    labels?: LabelsClient
  }

export type PointField = Omit<FieldBase, 'validate'> & {
  admin?: FieldAdmin & {
    components?: FieldAdmin['components'] & {
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
      Error?: CustomComponent<PointFieldErrorClientComponent | PointFieldErrorServerComponent>
      Label?: CustomComponent<PointFieldLabelClientComponent | PointFieldLabelServerComponent>
    }
    placeholder?: Record<string, string> | string
    step?: number
  }
  type: 'point'
  validate?: PointFieldValidation
}

export type PointFieldClient = FieldBaseClient &
  Pick<PointField, 'type'> & {
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    admin?: AdminClient & Pick<PointField['admin'], 'placeholder' | 'step'>
  }

/**
 * A virtual field that loads in related collections by querying a relationship or upload field.
 */
export type JoinField = FieldBase &
  FieldGraphQLType & {
    access?: {
      create?: never
      read?: FieldAccess
      update?: never
    }
    admin?: FieldAdmin & {
      allowCreate?: boolean
      components?: FieldAdmin['components'] & {
        afterInput?: CustomComponent[]
        beforeInput?: CustomComponent[]
        Error?: CustomComponent<JoinFieldErrorClientComponent | JoinFieldErrorServerComponent>
        Label?: CustomComponent<JoinFieldLabelClientComponent | JoinFieldLabelServerComponent>
      }
      defaultColumns?: string[]
      disableBulkEdit?: never
      disableRowTypes?: boolean
      readOnly?: never
    }
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
     * Under the hood, a field with {@link https://payloadcms.com/docs/configuration/collections#fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
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
  }

export type JoinFieldClient = FieldBaseClient &
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
  > & {
    admin?: AdminClient &
      Pick<
        JoinField['admin'],
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        'allowCreate' | 'defaultColumns' | 'disableBulkEdit' | 'disableRowTypes' | 'readOnly'
      >
  } & { targetField: Pick<RelationshipFieldClient, 'relationTo'> }

export type FlattenedBlock = Block & {
  flattenedFields: FlattenedField[]
}

export type FlattenedBlocksField = Omit<BlocksField, 'blockReferences' | 'blocks'> & {
  /**
   * Like `blocks`, but allows you to also pass strings that are slugs of blocks defined in `config.blocks`.
   *
   * @todo `blockReferences` will be merged with `blocks` in 4.0
   */
  blockReferences?: (FlattenedBlock | string)[]
  blocks: FlattenedBlock[]
}

export type FlattenedGroupField = GroupField & {
  flattenedFields: FlattenedField[]
  name: string
}

export type FlattenedArrayField = ArrayField & {
  flattenedFields: FlattenedField[]
}

export type FlattenedTabAsField = MarkRequired<TabAsField, 'name'> & {
  flattenedFields: FlattenedField[]
}

export type FlattenedJoinField = JoinField & {
  targetField: RelationshipField | UploadField
}

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
  | JoinField
  | JSONField
  | NamedGroupField
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
  | JoinFieldClient
  | JSONFieldClient
  | NamedGroupFieldClient
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
  | JSONField
  | NamedGroupField
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
  | JSONFieldClient
  | NamedGroupFieldClient
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

export type FieldWithPath = Field & {
  path?: string
}

export type FieldWithPathClient = ClientField & {
  path?: string
}

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

export function fieldHasSubFields<TField extends ClientField | Field | TabAsField>(
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
): field is TField & { admin: { position: 'sidebar' } } {
  return 'admin' in field && 'position' in field.admin! && field.admin.position === 'sidebar'
}

export function fieldIsID<TField extends ClientField | Field>(
  field: TField,
): field is TField & { name: 'id' } {
  return 'name' in field && field.name === 'id'
}

export function fieldIsHiddenOrDisabled<
  TField extends ClientField | Field | TabAsField | TabAsFieldClient,
>(field: TField): field is TField & { admin: { hidden: true } } {
  if ('hidden' in field && field.hidden) {
    return true
  }
  if (!('admin' in field) || !field.admin || !('disabled' in field.admin)) {
    return false
  }
  const disabled = field.admin.disabled
  if (disabled === true) {
    return true
  }
  return typeof disabled === 'object' && disabled !== null && disabled.field === true
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

export function groupHasName(
  group: Partial<NamedGroupFieldClient>,
): group is NamedGroupFieldClient {
  return 'name' in group
}

/**
 * Check if a field has localized: true set. This does not check if a field *should*
 * be localized. To check if a field should be localized, use `fieldShouldBeLocalized`.
 *
 * @deprecated this will be removed or modified in v4.0, as `fieldIsLocalized` can easily lead to bugs due to
 * parent field localization not being taken into account.
 */
export function fieldIsLocalized(field: Field | Tab): boolean {
  return 'localized' in field && field.localized!
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
  return 'localized' in field && field.localized! && !parentIsLocalized
}

export function fieldIsVirtual(field: Field | Tab): boolean {
  return 'virtual' in field && Boolean(field.virtual)
}

export type HookName =
  | 'afterChange'
  | 'afterRead'
  | 'beforeChange'
  | 'beforeRead'
  | 'beforeValidate'
