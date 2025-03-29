// @ts-strict-ignore
import type { GenericLanguages, I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'

import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Config, PayloadComponent, SanitizedConfig } from '../config/types.js'
import type { ValidationFieldError } from '../errors/ValidationError.js'
import type {
  FieldAffectingData,
  RichTextField,
  RichTextFieldClient,
  Validate,
} from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { RequestContext } from '../index.js'
import type { JsonObject, PayloadRequest, PopulateType } from '../types/index.js'
import type { RichTextFieldClientProps, RichTextFieldServerProps } from './fields/RichText.js'
import type { FieldDiffClientProps, FieldDiffServerProps, FieldSchemaMap } from './types.js'

export type AfterReadRichTextHookArgs<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  currentDepth?: number

  depth?: number

  draft?: boolean

  fallbackLocale?: string
  fieldPromises?: Promise<void>[]

  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean

  flattenLocales?: boolean

  locale?: string

  /** A string relating to which operation the field type is currently executing within. */
  operation?: 'create' | 'delete' | 'read' | 'update'

  overrideAccess?: boolean

  populate?: PopulateType

  populationPromises?: Promise<void>[]
  showHiddenFields?: boolean
  triggerAccessControl?: boolean
  triggerHooks?: boolean
}

export type AfterChangeRichTextHookArgs<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  /** A string relating to which operation the field type is currently executing within. */
  operation: 'create' | 'update'
  /** The document before changes were applied. */
  previousDoc?: TData
  /** The sibling data of the document before changes being applied. */
  previousSiblingDoc?: TData
  /** The previous value of the field, before changes */
  previousValue?: TValue
}
export type BeforeValidateRichTextHookArgs<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  /** A string relating to which operation the field type is currently executing within. */
  operation: 'create' | 'update'
  overrideAccess?: boolean
  /** The sibling data of the document before changes being applied. */
  previousSiblingDoc?: TData
  /** The previous value of the field, before changes */
  previousValue?: TValue
}

export type BeforeChangeRichTextHookArgs<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  /**
   * The original data with locales (not modified by any hooks). Only available in `beforeChange` and `beforeDuplicate` field hooks.
   */
  docWithLocales?: JsonObject

  duplicate?: boolean

  errors?: ValidationFieldError[]
  /**
   * Built up field label
   *
   * @example "Group Field > Tab Field > Rich Text Field"
   */
  fieldLabelPath: string
  /** Only available in `beforeChange` field hooks */
  mergeLocaleActions?: (() => Promise<void> | void)[]
  /** A string relating to which operation the field type is currently executing within. */
  operation?: 'create' | 'delete' | 'read' | 'update'
  /** The sibling data of the document before changes being applied. */
  previousSiblingDoc?: TData
  /** The previous value of the field, before changes */
  previousValue?: TValue

  /**
   * The original siblingData with locales (not modified by any hooks).
   */
  siblingDocWithLocales?: JsonObject
  skipValidation?: boolean
}

export type BaseRichTextHookArgs<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  /** The collection which the field belongs to. If the field belongs to a global, this will be null. */
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<TData>
  /** The field which the hook is running against. */
  field: FieldAffectingData
  /** The global which the field belongs to. If the field belongs to a collection, this will be null. */
  global: null | SanitizedGlobalConfig
  indexPath: number[]
  /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
  originalDoc?: TData
  parentIsLocalized: boolean
  /**
   * The path of the field, e.g. ["group", "myArray", 1, "textField"]. The path is the schemaPath but with indexes and would be used in the context of field data, not field schemas.
   */
  path: (number | string)[]
  /** The Express request object. It is mocked for Local API operations. */
  req: PayloadRequest
  /**
   * The schemaPath of the field, e.g. ["group", "myArray", "textField"]. The schemaPath is the path but without indexes and would be used in the context of field schemas, not field data.
   */
  schemaPath: string[]
  /** The sibling data passed to a field that the hook is running against. */
  siblingData: Partial<TSiblingData>
  /** The value of the field. */
  value?: TValue
}

export type AfterReadRichTextHook<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = (
  args: AfterReadRichTextHookArgs<TData, TValue, TSiblingData> &
    BaseRichTextHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type AfterChangeRichTextHook<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = (
  args: AfterChangeRichTextHookArgs<TData, TValue, TSiblingData> &
    BaseRichTextHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type BeforeChangeRichTextHook<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = (
  args: BaseRichTextHookArgs<TData, TValue, TSiblingData> &
    BeforeChangeRichTextHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type BeforeValidateRichTextHook<
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = (
  args: BaseRichTextHookArgs<TData, TValue, TSiblingData> &
    BeforeValidateRichTextHookArgs<TData, TValue, TSiblingData>,
) => Promise<TValue> | TValue

export type RichTextHooks = {
  afterChange?: AfterChangeRichTextHook[]
  afterRead?: AfterReadRichTextHook[]
  beforeChange?: BeforeChangeRichTextHook[]
  beforeValidate?: BeforeValidateRichTextHook[]
}
type RichTextAdapterBase<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = {
  generateImportMap?: Config['admin']['importMap']['generators'][0]
  generateSchemaMap?: (args: {
    config: SanitizedConfig
    field: RichTextField
    i18n: I18n<any, any>
    schemaMap: FieldSchemaMap
    schemaPath: string
  }) => FieldSchemaMap
  /**
   * Like an afterRead hook, but runs only for the GraphQL resolver. For populating data, this should be used, as afterRead hooks do not have a depth in graphQL.
   *
   * To populate stuff / resolve field hooks, mutate the incoming populationPromises or fieldPromises array. They will then be awaited in the correct order within payload itself.
   * @param data
   */
  graphQLPopulationPromises?: (data: {
    context: RequestContext
    currentDepth?: number
    depth: number
    draft: boolean
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    fieldPromises: Promise<void>[]
    findMany: boolean
    flattenLocales: boolean
    overrideAccess?: boolean
    parentIsLocalized: boolean
    populateArg?: PopulateType
    populationPromises: Promise<void>[]
    req: PayloadRequest
    showHiddenFields: boolean
    siblingDoc: JsonObject
  }) => void
  hooks?: RichTextHooks
  i18n?: Partial<GenericLanguages>
  outputSchema?: (args: {
    collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
    config?: SanitizedConfig
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    i18n?: I18n
    /**
     * Allows you to define new top-level interfaces that can be re-used in the output schema.
     */
    interfaceNameDefinitions: Map<string, JSONSchema4>
    isRequired: boolean
  }) => JSONSchema4
  validate: Validate<
    Value,
    Value,
    unknown,
    RichTextField<Value, AdapterProps, ExtraFieldProperties>
  >
}

export type RichTextAdapter<
  Value extends object = any,
  AdapterProps = any,
  ExtraFieldProperties = any,
> = {
  CellComponent: PayloadComponent<never>
  /**
   * Component that will be displayed in the version diff view.
   * If not provided, richtext content will be diffed as JSON.
   */
  DiffComponent?: PayloadComponent<
    FieldDiffServerProps<RichTextField, RichTextFieldClient>,
    FieldDiffClientProps<RichTextFieldClient>
  >
  FieldComponent: PayloadComponent<RichTextFieldServerProps, RichTextFieldClientProps>
} & RichTextAdapterBase<Value, AdapterProps, ExtraFieldProperties>

export type RichTextAdapterProvider<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = ({
  config,
  isRoot,
  parentIsLocalized,
}: {
  config: SanitizedConfig
  /**
   * Whether or not this is the root richText editor, defined in the payload.config.ts.
   *
   * @default false
   */
  isRoot?: boolean
  parentIsLocalized: boolean
}) =>
  | Promise<RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>>
  | RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>
