import type { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired, IsAny, MarkOptional } from 'ts-essentials'

import type { CustomUpload } from '../../admin/types.js'
import type { Arguments as MeArguments } from '../../auth/operations/me.js'
import type {
  Arguments as RefreshArguments,
  Result as RefreshResult,
} from '../../auth/operations/refresh.js'
import type { Auth, ClientUser, IncomingAuthType } from '../../auth/types.js'
import type {
  Access,
  AfterErrorHookArgs,
  AfterErrorResult,
  CustomComponent,
  EditConfig,
  Endpoint,
  EntityDescription,
  EntityDescriptionComponent,
  GeneratePreviewURL,
  LabelFunction,
  LivePreviewConfig,
  MetaConfig,
  PayloadComponent,
  StaticLabel,
} from '../../config/types.js'
import type { DBIdentifierName } from '../../database/types.js'
import type {
  Field,
  FlattenedField,
  JoinField,
  RelationshipField,
  UploadField,
} from '../../fields/config/types.js'
import type {
  CollectionSlug,
  JsonObject,
  RequestContext,
  TypedAuthOperations,
  TypedCollection,
  TypedCollectionSelect,
  TypedLocale,
} from '../../index.js'
import type {
  PayloadRequest,
  SelectIncludeType,
  SelectType,
  Sort,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type { SanitizedUploadConfig, UploadConfig } from '../../uploads/types.js'
import type {
  IncomingCollectionVersions,
  SanitizedCollectionVersions,
} from '../../versions/types.js'
import type { AfterOperationArg, AfterOperationMap } from '../operations/utils.js'

export type DataFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollection[TSlug]

export type SelectFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollectionSelect[TSlug]

export type AuthOperationsFromCollectionSlug<TSlug extends CollectionSlug> =
  TypedAuthOperations[TSlug]

export type RequiredDataFromCollection<TData extends JsonObject> = MarkOptional<
  TData,
  'createdAt' | 'id' | 'sizes' | 'updatedAt'
>

export type RequiredDataFromCollectionSlug<TSlug extends CollectionSlug> =
  RequiredDataFromCollection<DataFromCollectionSlug<TSlug>>

export type HookOperationType =
  | 'autosave'
  | 'count'
  | 'countVersions'
  | 'create'
  | 'delete'
  | 'forgotPassword'
  | 'login'
  | 'read'
  | 'refresh'
  | 'update'

type CreateOrUpdateOperation = Extract<HookOperationType, 'create' | 'update'>

export type BeforeOperationHook = (args: {
  args?: any
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  /**
   * Hook operation being performed
   */
  operation: HookOperationType
  req: PayloadRequest
}) => any

export type BeforeValidateHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  data?: Partial<T>
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation
  /**
   * Original document before change
   *
   * `undefined` on 'create' operation
   */
  originalDoc?: T
  req: PayloadRequest
}) => any

export type BeforeChangeHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  data: Partial<T>
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation
  /**
   * Original document before change
   *
   * `undefined` on 'create' operation
   */
  originalDoc?: T
  req: PayloadRequest
}) => any

export type AfterChangeHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation
  previousDoc: T
  req: PayloadRequest
}) => any

export type BeforeReadHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  query: { [key: string]: any }
  req: PayloadRequest
}) => any

export type AfterReadHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  findMany?: boolean
  query?: { [key: string]: any }
  req: PayloadRequest
}) => any

export type BeforeDeleteHook = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  id: number | string
  req: PayloadRequest
}) => any

export type AfterDeleteHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  id: number | string
  req: PayloadRequest
}) => any

export type AfterOperationHook<TOperationGeneric extends CollectionSlug = string> = (
  arg: AfterOperationArg<TOperationGeneric>,
) =>
  | Awaited<
      ReturnType<AfterOperationMap<TOperationGeneric>[keyof AfterOperationMap<TOperationGeneric>]>
    >
  | Promise<
      Awaited<
        ReturnType<AfterOperationMap<TOperationGeneric>[keyof AfterOperationMap<TOperationGeneric>]>
      >
    >

export type BeforeLoginHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  req: PayloadRequest
  user: T
}) => any

export type AfterLoginHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  req: PayloadRequest
  token: string
  user: T
}) => any

export type AfterLogoutHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  req: PayloadRequest
}) => any

export type AfterMeHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  req: PayloadRequest
  response: unknown
}) => any

export type RefreshHook<T extends TypeWithID = any> = (args: {
  args: RefreshArguments
  user: T
}) => Promise<RefreshResult | void> | (RefreshResult | void)

export type MeHook<T extends TypeWithID = any> = (args: {
  args: MeArguments
  user: T
}) => ({ exp: number; user: T } | void) | Promise<{ exp: number; user: T } | void>

export type AfterRefreshHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  exp: number
  req: PayloadRequest
  token: string
}) => any

export type AfterErrorHook = (
  args: { collection: SanitizedCollectionConfig } & AfterErrorHookArgs,
) => AfterErrorResult | Promise<AfterErrorResult>

export type AfterForgotPasswordHook = (args: {
  args?: any
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
}) => any

export type BaseListFilter = (args: {
  limit: number
  locale?: TypedLocale
  page: number
  req: PayloadRequest
  sort: string
}) => null | Promise<null | Where> | Where

export type CollectionAdminOptions = {
  baseListFilter?: BaseListFilter
  /**
   * Custom admin components
   */
  components?: {
    afterList?: CustomComponent[]
    afterListTable?: CustomComponent[]
    beforeList?: CustomComponent[]
    beforeListTable?: CustomComponent[]
    Description?: EntityDescriptionComponent
    /**
     * Components within the edit view
     */
    edit?: {
      /**
       * Replaces the "Preview" button
       */
      PreviewButton?: CustomComponent
      /**
       * Replaces the "Publish" button
       * + drafts must be enabled
       */
      PublishButton?: CustomComponent
      /**
       * Replaces the "Save" button
       * + drafts must be disabled
       */
      SaveButton?: CustomComponent
      /**
       * Replaces the "Save Draft" button
       * + drafts must be enabled
       * + autosave must be disabled
       */
      SaveDraftButton?: CustomComponent
      /**
       * Replaces the "Upload" section
       * + upload must be enabled
       */
      Upload?: CustomUpload
    }
    listMenuItems?: CustomComponent[]
    views?: {
      /**
       * Set to a React component to replace the entire Edit View, including all nested routes.
       * Set to an object to replace or modify individual nested routes, or to add new ones.
       */
      edit?: EditConfig
      list?: {
        actions?: CustomComponent[]
        Component?: PayloadComponent
      }
    }
  }
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
  /**
   * Default columns to show in list view
   */
  defaultColumns?: string[]
  /**
   * Custom description for collection. This will also be used as JSDoc for the generated types
   */
  description?: EntityDescription
  /**
   * Disable the Copy To Locale button in the edit document view
   * @default false
   */
  disableCopyToLocale?: boolean
  enableRichTextLink?: boolean
  enableRichTextRelationship?: boolean
  /**
   * Specify a navigational group for collections in the admin sidebar.
   * - Provide a string to place the entity in a custom group.
   * - Provide a record to define localized group names.
   * - Set to `false` to exclude the entity from the sidebar / dashboard without disabling its routes.
   */
  group?: false | Record<string, string> | string
  /**
   * Exclude the collection from the admin nav and routes
   */
  hidden?: ((args: { user: ClientUser }) => boolean) | boolean
  /**
   * Hide the API URL within the Edit view
   */
  hideAPIURL?: boolean
  /**
   * Additional fields to be searched via the full text search
   */
  listSearchableFields?: string[]
  /**
   * Live preview options
   */
  livePreview?: LivePreviewConfig
  meta?: MetaConfig
  pagination?: {
    defaultLimit?: number
    limits?: number[]
  }
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
  /**
   * Field to use as title in Edit View and first column in List view
   */
  useAsTitle?: string
}

/** Manage all aspects of a data collection */
export type CollectionConfig<TSlug extends CollectionSlug = any> = {
  /**
   * Do not set this property manually. This is set to true during sanitization, to avoid
   * sanitizing the same collection multiple times.
   */
  _sanitized?: boolean
  /**
   * Access control
   */
  access?: {
    admin?: ({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>
    create?: Access
    delete?: Access
    read?: Access
    readVersions?: Access
    unlock?: Access
    update?: Access
  }
  /**
   * Collection admin options
   */
  admin?: CollectionAdminOptions
  /**
   * Collection login options
   *
   * Use `true` to enable with default options
   */
  auth?: boolean | IncomingAuthType
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  /**
   * Used to override the default naming of the database table or collection with your using a function or string
   * @WARNING: If you change this property with existing data, you will need to handle the renaming of the table in your database or by using migrations
   */
  dbName?: DBIdentifierName
  defaultPopulate?: IsAny<SelectFromCollectionSlug<TSlug>> extends true
    ? SelectType
    : SelectFromCollectionSlug<TSlug>
  /**
   * Default field to sort by in collection list view
   */
  defaultSort?: Sort
  /**
   * When true, do not show the "Duplicate" button while editing documents within this collection and prevent `duplicate` from all APIs
   */
  disableDuplicate?: boolean
  /**
   * Opt-in to enable query presets for this collection.
   * @see https://payloadcms.com/docs/query-presets/overview
   */
  enableQueryPresets?: boolean
  /**
   * Custom rest api endpoints, set false to disable all rest endpoints for this collection.
   */
  endpoints?: false | Omit<Endpoint, 'root'>[]
  fields: Field[]
  /**
   * Specify which fields should be selected always, regardless of the `select` query which can be useful that the field exists for access control / hooks
   */
  forceSelect?: IsAny<SelectFromCollectionSlug<TSlug>> extends true
    ? SelectIncludeType
    : SelectFromCollectionSlug<TSlug>
  /**
   * GraphQL configuration
   */
  graphQL?:
    | {
        disableMutations?: true
        disableQueries?: true
        pluralName?: string
        singularName?: string
      }
    | false
  /**
   * Hooks to modify Payload functionality
   */
  hooks?: {
    afterChange?: AfterChangeHook[]
    afterDelete?: AfterDeleteHook[]
    afterError?: AfterErrorHook[]
    afterForgotPassword?: AfterForgotPasswordHook[]
    afterLogin?: AfterLoginHook[]
    afterLogout?: AfterLogoutHook[]
    afterMe?: AfterMeHook[]
    afterOperation?: AfterOperationHook<TSlug>[]
    afterRead?: AfterReadHook[]
    afterRefresh?: AfterRefreshHook[]
    beforeChange?: BeforeChangeHook[]
    beforeDelete?: BeforeDeleteHook[]
    beforeLogin?: BeforeLoginHook[]
    beforeOperation?: BeforeOperationHook[]
    beforeRead?: BeforeReadHook[]
    beforeValidate?: BeforeValidateHook[]
    /**
    /**
     * Use the `me` hook to control the `me` operation.
     * Here, you can optionally instruct the me operation to return early,
     * and skip its default logic.
     */
    me?: MeHook[]
    /**
     * Use the `refresh` hook to control the refresh operation.
     * Here, you can optionally instruct the refresh operation to return early,
     * and skip its default logic.
     */
    refresh?: RefreshHook[]
  }
  /**
   * Define compound indexes for this collection.
   * This can be used to either speed up querying/sorting by 2 or more fields at the same time or
   * to ensure uniqueness between several fields.
   * Specify field paths
   * @example
   * [{ unique: true, fields: ['title', 'group.name'] }]
   * @default []
   */
  indexes?: CompoundIndex[]
  /**
   * Label configuration
   */
  labels?: {
    plural?: LabelFunction | StaticLabel
    singular?: LabelFunction | StaticLabel
  }
  /**
   * Enables / Disables the ability to lock documents while editing
   * @default true
   */
  lockDocuments?:
    | {
        duration: number
      }
    | false
  /**
   * If true, enables custom ordering for the collection, and documents in the listView can be reordered via drag and drop.
   * New documents are inserted at the end of the list according to this parameter.
   *
   * Under the hood, a field with {@link https://observablehq.com/@dgreensp/implementing-fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
   *
   * @default false
   *
   * @experimental There may be frequent breaking changes to this API
   */
  orderable?: boolean
  slug: string
  /**
   * Add `createdAt` and `updatedAt` fields
   *
   * @default true
   */
  timestamps?: boolean
  /**
   * Options used in typescript generation
   */
  typescript?: {
    /**
     * Typescript generation name given to the interface type
     */
    interface?: string
  }
  /**
   * Customize the handling of incoming file uploads
   *
   * @default false // disable uploads
   */
  upload?: boolean | UploadConfig
  /**
   * Enable versioning. Set it to true to enable default versions settings,
   * or customize versions options by setting the property equal to an object
   * containing the version options.
   *
   * @default false // disable versioning
   */
  versions?: boolean | IncomingCollectionVersions
}

export type SanitizedJoin = {
  /**
   * The field configuration defining the join
   */
  field: JoinField
  getForeignPath?(args: { locale?: TypedLocale }): string
  /**
   * The path of the join field in dot notation
   */
  joinPath: string
  /**
   * `parentIsLocalized` is true if any parent field of the
   * field configuration defining the join is localized
   */
  parentIsLocalized: boolean
  targetField: RelationshipField | UploadField
}

export type SanitizedJoins = {
  [collectionSlug: string]: SanitizedJoin[]
}

/**
 * @todo remove the `DeepRequired` in v4.
 * We don't actually guarantee that all properties are set when sanitizing configs.
 */
export interface SanitizedCollectionConfig
  extends Omit<
    DeepRequired<CollectionConfig>,
    'auth' | 'endpoints' | 'fields' | 'slug' | 'upload' | 'versions'
  > {
  auth: Auth
  endpoints: Endpoint[] | false
  fields: Field[]
  /**
   * Fields in the database schema structure
   * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
   */
  flattenedFields: FlattenedField[]
  /**
   * Object of collections to join 'Join Fields object keyed by collection
   */
  joins: SanitizedJoins

  /**
   * List of all polymorphic join fields
   */
  polymorphicJoins: SanitizedJoin[]

  sanitizedIndexes: SanitizedCompoundIndex[]

  slug: CollectionSlug
  upload: SanitizedUploadConfig
  versions: SanitizedCollectionVersions
}

export type Collection = {
  config: SanitizedCollectionConfig
  customIDType?: 'number' | 'text'
  graphQL?: {
    countType: GraphQLObjectType
    JWT: GraphQLObjectType
    mutationInputType: GraphQLNonNull<any>
    paginatedType: GraphQLObjectType
    type: GraphQLObjectType
    updateMutationInputType: GraphQLNonNull<any>
    versionType: GraphQLObjectType
    whereInputType: GraphQLInputObjectType
  }
}

export type BulkOperationResult<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  docs: TransformCollectionWithSelect<TSlug, TSelect>[]
  errors: {
    id: DataFromCollectionSlug<TSlug>['id']
    message: string
  }[]
}

export type AuthCollection = {
  config: SanitizedCollectionConfig
}

export type TypeWithID = {
  docId?: any
  id: number | string
}

export type TypeWithTimestamps = {
  [key: string]: unknown
  createdAt: string
  id: number | string
  updatedAt: string
}

export type CompoundIndex = {
  fields: string[]
  unique?: boolean
}

export type SanitizedCompoundIndex = {
  fields: {
    field: FlattenedField
    localizedPath: string
    path: string
    pathHasLocalized: boolean
  }[]
  unique: boolean
}
