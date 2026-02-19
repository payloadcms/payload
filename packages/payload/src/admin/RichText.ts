/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GenericLanguages, I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'

import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { ImportMapGenerators, PayloadComponent, SanitizedConfig } from '../config/types.js'
import type { ValidationFieldError } from '../errors/ValidationError.js'
import type {
  Field,
  FieldAffectingData,
  RichTextField,
  RichTextFieldClient,
  TabAsField,
  Validate,
} from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { RequestContext, TypedFallbackLocale } from '../index.js'
import type { JsonObject, PayloadRequest, PopulateType } from '../types/index.js'
import type { RichTextFieldClientProps, RichTextFieldServerProps } from './fields/RichText.js'
import type { FormStateWithoutComponents } from './forms/Form.js'
import type {
  ClientFieldSchemaMap,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldSchemaMap,
} from './types.js'

export type AfterReadRichTextHookArgs<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TData extends TypeWithID = any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TValue = any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSiblingData = any,
> = {
  currentDepth?: number

  depth?: number

  draft?: boolean

  fallbackLocale?: TypedFallbackLocale
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
  previousSiblingDoc?: TSiblingData
  /** The previous value of the field, before changes */
  previousValue?: TValue
}

export type BeforeValidateRichTextHookArgs<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TData extends TypeWithID = any,
  TValue = any,
  TSiblingData = any,
> = {
  /** A string relating to which operation the field type is currently executing within. */
  operation: 'create' | 'update'
  overrideAccess?: boolean
  /** The sibling data of the document before changes being applied. */
  previousSiblingDoc?: TSiblingData
  /** The previous value of the field, before changes */
  previousValue?: TValue
}

export type BeforeChangeRichTextHookArgs<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  overrideAccess: boolean
  /** The sibling data of the document before changes being applied. */
  previousSiblingDoc?: TSiblingData
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
  /**
   * Build form state entries for nested fields within the rich text value (e.g. blocks, links, uploads).
   *
   * The adapter owns the iteration: it walks the rich text data, finds nodes with nested fields,
   * and calls the provided `iterateFields` function for each. This mirrors how `generateSchemaMap`
   * works — the adapter receives tools and handles traversal internally.
   *
   * Nested field paths use the node ID as a bridge: `{path}.{nodeId}.{fieldName}`.
   * The node ID flattens the freeform tree — the form state doesn't care about tree depth or position.
   */
  buildFormState?: (args: {
    /**
     * The rich text field's data value. May be the original data (initial load) or include
     * current nested field values merged in by `reduceFieldsToValues` + unflatten (on change).
     */
    data: any
    fieldSchemaMap: FieldSchemaMap
    /**
     * The `iterateFields` function from `@payloadcms/ui`. Call this for each node's fields
     * with the appropriate `parentPath` and `parentSchemaPath`.
     */
    iterateFields: (args: {
      addErrorPathToParent: (fieldPath: string) => void
      anyParentLocalized?: boolean
      blockData: any
      clientFieldSchemaMap?: ClientFieldSchemaMap
      collectionSlug?: string
      data: any
      fields: any[]
      fieldSchemaMap: FieldSchemaMap
      filter?: any
      forceFullValue?: boolean
      fullData: any
      id?: number | string
      includeSchema?: boolean
      mockRSCs?: any
      omitParents?: boolean
      operation: 'create' | 'update'
      parentIndexPath: string
      parentPassesCondition?: boolean
      parentPath: string
      parentSchemaPath: string
      permissions: any
      preferences?: any
      previousFormState: any
      readOnly?: boolean
      renderAllFields: boolean
      renderFieldFn: any
      req: PayloadRequest
      select?: any
      selectMode?: any
      skipConditionChecks?: boolean
      skipValidation?: boolean
      state?: FormStateWithoutComponents
    }) => Promise<void>
    /**
     * Common args to forward to `iterateFields`. These come from the parent `addFieldStatePromise` context.
     */
    iterateFieldsArgs: {
      addErrorPathToParent: (fieldPath: string) => void
      anyParentLocalized?: boolean
      clientFieldSchemaMap?: ClientFieldSchemaMap
      collectionSlug?: string
      fieldSchemaMap: FieldSchemaMap
      filter?: any
      forceFullValue?: boolean
      fullData: any
      id?: number | string
      includeSchema?: boolean
      mockRSCs?: any
      omitParents?: boolean
      operation: 'create' | 'update'
      preferences?: any
      previousFormState: any
      readOnly?: boolean
      renderAllFields: boolean
      renderFieldFn: any
      req: PayloadRequest
      select?: any
      selectMode?: any
      skipConditionChecks?: boolean
      skipValidation?: boolean
      state: FormStateWithoutComponents
    }
    path: string
    schemaPath: string
  }) => Promise<void>
  /**
   * Apply default values to nested fields within the rich text value (e.g. blocks, inline blocks).
   *
   * Called during `calculateDefaultValues` before form state is built. The adapter walks its
   * data tree, finds nodes with sub-fields, and calls `iterateFields` to apply defaults.
   * This ensures that newly created nodes (e.g. a code block) get their field defaults
   * (e.g. `language: 'typescript'`) applied before form state is populated.
   */
  calculateDefaultValues?: (args: {
    data: any
    id?: number | string
    iterateFields: (args: {
      data: any
      fields: (Field | TabAsField)[]
      id?: number | string
      locale: string | undefined
      req: PayloadRequest
      siblingData: Record<string, unknown>
      user: PayloadRequest['user']
    }) => Promise<void>
    locale: string | undefined
    req: PayloadRequest
    user: PayloadRequest['user']
  }) => Promise<void>
  /**
   * Provide a function that can be used to add items to the import map. This is useful for
   * making modules available to the client.
   */
  generateImportMap?: ImportMapGenerators[0]
  /**
   * Provide a function that can be used to add items to the schema map. This is useful for
   * richtext sub-fields the server needs to "know" about in order to do things like calculate form state.
   *
   * This function is run within `buildFieldSchemaMap`.
   */
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
  /**
   * @deprecated - manually merge i18n translations into the config.i18n.translations object within the adapter provider instead.
   * This property will be removed in v4.
   */
  i18n?: Partial<GenericLanguages>
  /**
   * Return the JSON schema for the field value. The JSON schema is read by
   * `json-schema-to-typescript` which is used to generate types for this richtext field
   * payload-types.ts)
   */
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
  /**
   * Provide validation function for the richText field. This function is run the same way
   * as other field validation functions.
   */
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
  /**
   * Component that will be displayed in the list view. Can be typed as
   * `DefaultCellComponentProps` or `DefaultServerCellComponentProps`.
   */
  CellComponent: PayloadComponent<never>
  /**
   * Component that will be displayed in the version diff view.
   * If not provided, richtext content will be diffed as JSON.
   */
  DiffComponent?: PayloadComponent<
    FieldDiffServerProps<RichTextField, RichTextFieldClient>,
    FieldDiffClientProps<RichTextFieldClient>
  >
  /**
   * Component that will be displayed in the edit view.
   */
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
   * Whether or not this is the root richText editor, defined in the top-level `editor` property
   * of the Payload Config.
   *
   * @default false
   */
  isRoot?: boolean
  parentIsLocalized: boolean
}) =>
  | Promise<RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>>
  | RichTextAdapter<Value, AdapterProps, ExtraFieldProperties>
