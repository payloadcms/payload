/* eslint-disable @typescript-eslint/no-explicit-any */

import type { EditorProps } from '@monaco-editor/react'
import type { CSSProperties } from 'react'

//eslint-disable-next-line @typescript-eslint/no-unused-vars
import monacoeditor from 'monaco-editor' // IMPORTANT - DO NOT REMOVE: This is required for pnpm's default isolated mode to work - even though the import is not used. This is due to a typescript bug: https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189. (tsbugisolatedmode)
import type { JSONSchema4 } from 'json-schema'
import type React from 'react'

import type { RichTextAdapter, RichTextAdapterProvider } from '../../admin/RichText.js'
import type { ErrorComponent } from '../../admin/forms/Error.js'
import type {
  ConditionalDateProps,
  Description,
  DescriptionComponent,
  LabelComponent,
  RowLabelComponent,
} from '../../admin/types.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../../collections/config/types.js'
import type { CustomComponent, LabelFunction, LabelStatic } from '../../config/types.js'
import type { DBIdentifierName } from '../../database/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { Operation, PayloadRequest, RequestContext, Where } from '../../types/index.js'
import type { ClientFieldConfig } from './client.js'

export type FieldHookArgs<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = {
  /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<TData>
  /**
   * Only available in the `afterRead` hook.
   */
  draft?: boolean
  /** The field which the hook is running against. */
  field: FieldAffectingData
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean
  /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
  global: SanitizedGlobalConfig | null
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
  /** The value of the field. */
  value?: TValue
}

export type FieldHook<TData extends TypeWithID = any, TValue = any, TSiblingData = any> = (
  args: FieldHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type FieldAccess<TData extends TypeWithID = any, TSiblingData = any> = (args: {
  /**
   * The incoming data used to `create` or `update` the document with. `data` is undefined during the `read` operation.
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
}) => Promise<boolean> | boolean

export type Condition<TData extends TypeWithID = any, TSiblingData = any> = (
  data: Partial<TData>,
  siblingData: Partial<TSiblingData>,
  { user }: { user: PayloadRequest['user'] },
) => boolean

export type FilterOptionsProps<TData = any> = {
  /**
   * An object containing the full collection or global document currently being edited.
   */
  data: TData
  /**
   * The `id` of the current document being edited. `id` is undefined during the `create` operation.
   */
  id: number | string
  /**
   * The collection `slug` to filter against, limited to this field's `relationTo` property.
   */
  relationTo: CollectionSlug
  /**
   * An object containing document data that is scoped to only fields within the same parent of this field.
   */
  siblingData: unknown
  /**
   * An object containing the currently authenticated user.
   */
  user: Partial<PayloadRequest['user']>
}

export type FilterOptionsFunc<TData = any> = (
  options: FilterOptionsProps<TData>,
) => Promise<Where | boolean> | Where | boolean

export type FilterOptions<TData = any> =
  | ((options: FilterOptionsProps<TData>) => Promise<Where | boolean> | Where | boolean)
  | Where
  | null

type Admin = {
  className?: string
  components?: {
    Cell?: CustomComponent
    Description?: DescriptionComponent
    Field?: CustomComponent
    /**
     * The Filter component has to be a client component
     */
    Filter?: React.ComponentType<any>
  }
  /**
   * You can programmatically show / hide fields based on what other fields are doing.
   * This is also run on the server, to determine if the field should be validated.
   */
  condition?: Condition
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
  description?: Description
  disableBulkEdit?: boolean
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
  disabled?: boolean
  hidden?: boolean
  position?: 'sidebar'
  readOnly?: boolean
  style?: CSSProperties
  width?: string
}

export type Labels = {
  plural: LabelFunction | LabelStatic
  singular: LabelFunction | LabelStatic
}

export type BaseValidateOptions<TData, TSiblingData, TValue> = {
  collectionSlug?: string
  data: Partial<TData>
  id?: number | string
  operation?: Operation
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
  value: TValue,
  options: ValidateOptions<TData, TSiblingData, TFieldConfig, TValue>,
) => Promise<string | true> | string | true

export type OptionObject = {
  label: LabelFunction | LabelStatic
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
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  defaultValue?: any
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
  label?: LabelFunction | LabelStatic | false
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
}

export type NumberField = {
  admin?: {
    /** Set this property to a string that will be used for browser autocomplete. */
    autoComplete?: string
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
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
  validate?: Validate<number | number[], unknown, unknown, NumberField>
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
) &
  FieldBase

export type TextField = {
  admin?: {
    autoComplete?: string
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
    placeholder?: Record<string, string> | string
    rtl?: boolean
  } & Admin
  maxLength?: number
  minLength?: number
  type: 'text'
  validate?: Validate<string | string[], unknown, unknown, TextField>
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
) &
  FieldBase

export type EmailField = {
  admin?: {
    autoComplete?: string
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
    placeholder?: Record<string, string> | string
  } & Admin
  type: 'email'
  validate?: Validate<string, unknown, unknown, EmailField>
} & FieldBase

export type TextareaField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
    placeholder?: Record<string, string> | string
    rows?: number
    rtl?: boolean
  } & Admin
  maxLength?: number
  minLength?: number
  type: 'textarea'
  validate?: Validate<string, unknown, unknown, TextareaField>
} & FieldBase

export type CheckboxField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
  } & Admin
  type: 'checkbox'
  validate?: Validate<unknown, unknown, unknown, CheckboxField>
} & FieldBase

export type DateField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
      afterInput?: CustomComponent[]
      beforeInput?: CustomComponent[]
    }
    date?: ConditionalDateProps
    placeholder?: Record<string, string> | string
  } & Admin
  type: 'date'
  validate?: Validate<unknown, unknown, unknown, DateField>
} & FieldBase

export type GroupField = {
  admin?: {
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
} & Omit<FieldBase, 'required'>

export type RowAdmin = Omit<Admin, 'description'>

export type RowField = {
  admin?: RowAdmin
  fields: Field[]
  type: 'row'
} & Omit<FieldBase, 'admin' | 'label' | 'name' | 'validate'>

export type CollapsibleField = {
  fields: Field[]
  type: 'collapsible'
} & (
  | {
      admin: {
        components: {
          RowLabel: RowLabelComponent
        } & Admin['components']
        initCollapsed?: boolean
      } & Admin
      label?: Required<FieldBase['label']>
    }
  | {
      admin?: {
        initCollapsed?: boolean
      } & Admin
      label: Required<FieldBase['label']>
    }
) &
  Omit<FieldBase, 'label' | 'name' | 'validate'>

export type TabsAdmin = Omit<Admin, 'description'>

type TabBase = {
  description?: Description
  fields: Field[]
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
} & Omit<TabBase, 'name'>

export type Tab = NamedTab | UnnamedTab

export type TabsField = {
  admin?: TabsAdmin
  tabs: Tab[]
  type: 'tabs'
} & Omit<FieldBase, 'admin' | 'localized' | 'name' | 'saveToJWT'>

export type TabAsField = {
  name?: string
  type: 'tab'
} & Tab

export type UIField = {
  admin: {
    components?: {
      Cell?: CustomComponent
      Field: CustomComponent
      /**
       * The Filter component has to be a client component
       */
      Filter?: React.ComponentType<any>
    }
    condition?: Condition
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    disableBulkEdit?: boolean
    /**
     * Shows / hides fields from appearing in the list view column selector.
     * @type boolean
     */
    disableListColumn?: boolean
    position?: string
    width?: string
  }
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  label?: Record<string, string> | string
  name: string
  type: 'ui'
}

export type UploadField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
    }
  }
  displayPreview?: boolean
  filterOptions?: FilterOptions
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
  relationTo: CollectionSlug
  type: 'upload'
  validate?: Validate<unknown, unknown, unknown, UploadField>
} & FieldBase

type CodeAdmin = {
  components?: {
    Error?: ErrorComponent
    Label?: LabelComponent
  }
  editorOptions?: EditorProps['options']
  language?: string
} & Admin

export type CodeField = {
  admin?: CodeAdmin
  maxLength?: number
  minLength?: number
  type: 'code'
  validate?: Validate<string, unknown, unknown, CodeField>
} & Omit<FieldBase, 'admin'>

type JSONAdmin = {
  components?: {
    Error?: ErrorComponent
    Label?: LabelComponent
  }
  editorOptions?: EditorProps['options']
} & Admin

export type JSONField = {
  admin?: JSONAdmin
  jsonSchema?: {
    fileMatch: string[]
    schema: JSONSchema4
    uri: string
  }
  type: 'json'
  validate?: Validate<Record<string, unknown>, unknown, unknown, JSONField>
} & Omit<FieldBase, 'admin'>

export type SelectField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
    }
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
  options: Option[]
  type: 'select'
  validate?: Validate<string, unknown, unknown, SelectField>
} & FieldBase

type SharedRelationshipProperties = {
  filterOptions?: FilterOptions
  hasMany?: boolean
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
  type: 'relationship'
  validate?: Validate<unknown, unknown, unknown, SharedRelationshipProperties>
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
) &
  FieldBase

type RelationshipAdmin = {
  allowCreate?: boolean
  components?: {
    Error?: ErrorComponent
    Label?: LabelComponent
  }
  isSortable?: boolean
} & Admin

export type PolymorphicRelationshipField = {
  admin?: {
    sortOptions?: { [collectionSlug: CollectionSlug]: string }
  } & RelationshipAdmin
  relationTo: CollectionSlug[]
} & SharedRelationshipProperties

export type SingleRelationshipField = {
  admin?: {
    sortOptions?: string
  } & RelationshipAdmin
  relationTo: CollectionSlug
} & SharedRelationshipProperties
export type RelationshipField = PolymorphicRelationshipField | SingleRelationshipField

export type ValueWithRelation = {
  relationTo: CollectionSlug
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
  ExtraProperties = object,
> = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
    }
  } & Admin
  editor?:
    | RichTextAdapter<Value, AdapterProps, AdapterProps>
    | RichTextAdapterProvider<Value, AdapterProps, AdapterProps>
  /**
   * Sets a maximum population depth for this field, regardless of the remaining depth when this field is reached.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
  type: 'richText'
} & ExtraProperties &
  FieldBase

export type ArrayField = {
  admin?: {
    components?: {
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
  validate?: Validate<unknown[], unknown, unknown, ArrayField>
} & FieldBase

export type RadioField = {
  admin?: {
    components?: {
      Error?: ErrorComponent
      Label?: LabelComponent
    }
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
  options: Option[]
  type: 'radio'
  validate?: Validate<string, unknown, unknown, RadioField>
} & FieldBase

export type Block = {
  admin?: {
    components?: {
      Label?: React.FC<{
        blockKind: 'block' | 'lexicalBlock' | 'lexicalInlineBlock' | string
        /**
         * May contain the formData
         */
        formData: Record<string, any>
      }>
    }
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
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
  imageURL?: string
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique amongst collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
  labels?: Labels
  slug: string
}

export type BlockField = {
  admin?: {
    initCollapsed?: boolean
    /**
     * Disable drag and drop sorting
     */
    isSortable?: boolean
  } & Admin
  blocks: Block[]
  defaultValue?: unknown
  labels?: Labels
  maxRows?: number
  minRows?: number
  type: 'blocks'
  validate?: Validate<string, unknown, unknown, BlockField>
} & FieldBase

export type PointField = {
  type: 'point'
  validate?: Validate<unknown, unknown, unknown, PointField>
} & FieldBase

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

export type FieldWithPath = {
  path?: string
} & Field

export type FieldWithSubFields = ArrayField | CollapsibleField | GroupField | RowField

export type FieldPresentationalOnly = UIField

export type FieldWithMany = RelationshipField | SelectField

export type FieldWithMaxDepth = RelationshipField | UploadField

export function fieldHasSubFields(field: ClientFieldConfig | Field): field is FieldWithSubFields {
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

export function fieldIsPresentationalOnly(
  field: ClientFieldConfig | Field | TabAsField,
): field is UIField {
  return field.type === 'ui'
}

export function fieldAffectsData(
  field: ClientFieldConfig | Field | TabAsField,
): field is FieldAffectingData {
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
