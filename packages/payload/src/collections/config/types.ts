/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired, IsAny, MarkOptional } from 'ts-essentials'

import type {
  CustomStatus,
  CustomUpload,
  PublishButtonClientProps,
  PublishButtonServerProps,
  UnpublishButtonClientProps,
  UnpublishButtonServerProps,
  ViewTypes,
} from '../../admin/types.js'
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
import type { HierarchyConfig, SanitizedHierarchyConfig } from '../../hierarchy/types.js'
import type {
  CollectionAdminCustom,
  CollectionCustom,
  CollectionSlug,
  GeneratedTypes,
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
import type {
  AfterOperationArg,
  BeforeOperationArg,
  OperationMap,
} from '../operations/utilities/types.js'

export type DataFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollection[TSlug]

export type SelectFromCollectionSlug<TSlug extends CollectionSlug> = TypedCollectionSelect[TSlug]

/**
 * Collection slugs that do not have drafts enabled.
 * Detects collections without drafts by checking for the absence of the `_status` field.
 */
export type CollectionsWithoutDrafts = {
  [TSlug in CollectionSlug]: DataFromCollectionSlug<TSlug> extends { _status?: any } ? never : TSlug
}[CollectionSlug]

/**
 * Conditionally allows or forbids the `draft` property based on collection configuration.
 * When `strictDraftTypes` is enabled, the `draft` property is forbidden on collections without drafts.
 */
export type DraftFlagFromCollectionSlug<TSlug extends CollectionSlug> = GeneratedTypes extends {
  strictDraftTypes: true
}
  ? TSlug extends CollectionsWithoutDrafts
    ? {
        /**
         * The `draft` property is not allowed because this collection does not have `versions.drafts` enabled.
         */
        draft?: never
      }
    : {
        /**
         * Whether the document(s) should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
         */
        draft?: boolean
      }
  : {
      /**
       * Whether the document(s) should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
       */
      draft?: boolean
    }

export type AuthOperationsFromCollectionSlug<TSlug extends CollectionSlug> =
  TypedAuthOperations[TSlug]

export type RequiredDataFromCollection<TData extends JsonObject> = MarkOptional<
  TData,
  'collection' | 'createdAt' | 'deletedAt' | 'id' | 'updatedAt'
>

export type RequiredDataFromCollectionSlug<TSlug extends CollectionSlug> =
  RequiredDataFromCollection<DataFromCollectionSlug<TSlug>>

/**
 * Helper type for draft data INPUT (e.g., create operations) - makes all fields optional except system fields
 * When creating a draft, required fields don't need to be provided as validation is skipped
 * The id field is optional since it's auto-generated
 */
export type DraftDataFromCollection<TData extends JsonObject> = Partial<
  Omit<TData, 'collection' | 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>
> &
  Partial<Pick<TData, 'collection' | 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>>

export type DraftDataFromCollectionSlug<TSlug extends CollectionSlug> = DraftDataFromCollection<
  DataFromCollectionSlug<TSlug>
>

/**
 * Helper type for draft data OUTPUT (e.g., query results) - makes user fields optional but keeps id required
 * When querying drafts, required fields may be null/undefined as validation is skipped, but system fields like id are always present
 */
export type QueryDraftDataFromCollection<TData extends JsonObject> = Partial<
  Omit<TData, 'createdAt' | 'deletedAt' | 'id' | 'sizes' | 'updatedAt'>
> &
  Partial<Pick<TData, 'createdAt' | 'deletedAt' | 'sizes' | 'updatedAt'>> &
  Pick<TData, 'id'>

export type QueryDraftDataFromCollectionSlug<TSlug extends CollectionSlug> =
  QueryDraftDataFromCollection<DataFromCollectionSlug<TSlug>>

export type HookOperationType =
  | 'autosave'
  | 'count'
  | 'countVersions'
  | 'create'
  | 'delete'
  | 'forgotPassword'
  | 'login'
  | 'read'
  | 'readDistinct'
  | 'refresh'
  | 'resetPassword'
  | 'restoreVersion'
  | 'update'

type CreateOrUpdateOperation = Extract<HookOperationType, 'create' | 'update'>

export type BeforeOperationHook<TOperationGeneric extends CollectionSlug = string> = (
  arg: BeforeOperationArg<TOperationGeneric>,
) =>
  | Parameters<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>[0]
  | Promise<Parameters<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>[0]>
  | Promise<void>
  | void

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
  data: Partial<T>
  doc: T
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  previousDoc: T
  req: PayloadRequest
}) => any

export type BeforeReadHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  query: { [key: string]: any }
  req: PayloadRequest
}) => any

export type AfterReadHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  findMany?: boolean
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
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
  | Awaited<ReturnType<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>>
  | Promise<
      Awaited<ReturnType<OperationMap<TOperationGeneric>[keyof OperationMap<TOperationGeneric>]>>
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type AfterLogoutHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  req: PayloadRequest
}) => any

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export type EnableFoldersOptions = {
  // Displays the folder collection and parentFolder field in the document view
  debug?: boolean
}

export type BaseFilter = (args: {
  limit: number
  locale?: TypedLocale
  page: number
  req: PayloadRequest
  sort: string
}) => null | Promise<null | Where> | Where

/**
 * @deprecated Use `BaseFilter` instead.
 */
export type BaseListFilter = BaseFilter

export type CollectionAdminOptions = {
  /**
   * Defines a default base filter which will be applied in the following parts of the admin panel:
   * - List View
   * - Relationship fields for internal links within the Lexical editor
   *
   * This is especially useful for plugins like multi-tenant. For example,
   * a user may have access to multiple tenants, but should only see content
   * related to the currently active or selected tenant in those places.
   */
  baseFilter?: BaseFilter
  /**
   * @deprecated Use `baseFilter` instead. If both are defined,
   * `baseFilter` will take precedence. This property remains only
   * for backward compatibility and may be removed in a future version.
   *
   * Originally, `baseListFilter` was intended to filter only the List View
   * in the admin panel. However, base filtering is often required in other areas
   * such as internal link relationships in the Lexical editor.
   */
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
       * Inject custom components before the document controls
       */
      beforeDocumentControls?: CustomComponent[]
      /**
       * Inject custom components before the document metadata (left of status/timestamps)
       */
      BeforeDocumentMeta?: CustomComponent[]
      /**
       * Inject custom components within the 3-dot menu dropdown
       */
      editMenuItems?: CustomComponent[]
      /**
       * Replaces the "Preview" button
       */
      PreviewButton?: CustomComponent
      /**
       * Replaces the "Publish" button
       * + drafts must be enabled
       */
      PublishButton?: PayloadComponent<PublishButtonServerProps, PublishButtonClientProps>
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
       * Replaces the "Status" section
       */
      Status?: CustomStatus
      /**
       * Replaces the "Unpublish" button
       * + drafts must be enabled
       */
      UnpublishButton?: PayloadComponent<UnpublishButtonServerProps, UnpublishButtonClientProps>
      /**
       * Replaces the "Upload" section
       * + upload must be enabled
       */
      Upload?: CustomUpload
    }
    listMenuItems?: CustomComponent[]
    views?: {
      /**
       * Replace, modify, or add new "document" views.
       * @link https://payloadcms.com/docs/custom-components/document-views
       */
      edit?: EditConfig
      /**
       * Replace or modify the "list" view.
       * @link https://payloadcms.com/docs/custom-components/list-view
       */
      list?: {
        actions?: CustomComponent[]
        Component?: PayloadComponent
      }
    }
  }
  /** Extension point to add your custom data. Available in server and client. */
  custom?: CollectionAdminCustom
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
  /**
   * Performance opt-in. If true, will use the [Select API](https://payloadcms.com/docs/queries/select) when
   * loading the list view to query only the active columns, as opposed to the entire documents.
   * If your cells require specific fields that may be unselected, such as within hooks, etc.,
   * use `forceSelect` in conjunction with this property.
   *
   * @experimental This is an experimental feature and may change in the future. Use at your own risk.
   */
  enableListViewSelectAPI?: boolean
  enableRichTextLink?: boolean
  enableRichTextRelationship?: boolean
  /**
   * Function to format the URL for document links in the list view.
   * Return null to disable linking for that document.
   * Return a string to customize the link destination.
   * If not provided, uses the default admin edit URL.
   */
  formatDocURL?: (args: {
    collectionSlug: string
    /**
     * The default URL that would normally be used for this document link.
     * You can return this as-is, modify it, or completely replace it.
     */
    defaultURL: string
    doc: Record<string, unknown>
    req: PayloadRequest
    /**
     * The current view context where the link is being generated.
     * Most relevant values for document linking are 'list' and 'trash'.
     */
    viewType?: ViewTypes
  }) => null | string
  /**
   * Specify a navigational group for collections in the admin sidebar.
   * - Provide a string to place the entity in a custom group.
   * - Provide a record to define localized group names.
   * - Set to `false` to exclude the entity from the sidebar / dashboard without disabling its routes.
   */
  group?: false | Record<string, string> | string
  /**
   * @description Enable grouping by a field in the list view.
   * Uses `payload.findDistinct` under the hood to populate the group-by options.
   *
   * @experimental This option is currently in beta and may change in future releases. Use at your own risk.
   */
  groupBy?: boolean
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
   * Live Preview options.
   *
   * @see https://payloadcms.com/docs/live-preview/overview
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
  /**
   * Configuration for bulk operations
   */
  /** Extension point to add your custom data. Server only. */
  custom?: CollectionCustom
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
   * Disable the bulk edit operation for the collection in the admin panel and the API
   */
  disableBulkEdit?: boolean
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
   * Enable hierarchical tree structure for this collection
   *
   * Use `true` to enable with defaults (auto-detects parent field)
   * or provide configuration object
   *
   * @example
   * // Enable with defaults
   * hierarchy: true
   *
   * @example
   * // Customize field names and slugify function
   * hierarchy: {
   *   parentFieldName: 'parent',
   *   slugify: (text) => customSlugify(text),
   *   slugPathFieldName: '_breadcrumbPath'
   * }
   */
  hierarchy?: boolean | HierarchyConfig
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
    beforeOperation?: BeforeOperationHook<TSlug>[]
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
   * Under the hood, a field with {@link https://payloadcms.com/docs/configuration/collections#fractional-indexing|fractional indexing} is used to optimize inserts and reorderings.
   *
   * @default false
   *
   * @experimental There may be frequent breaking changes to this API
   */
  orderable?: boolean
  slug: string
  /**
   * Add `createdAt`, `deletedAt` and `updatedAt` fields
   *
   * @default true
   */
  timestamps?: boolean
  /**
   * Enables trash support for this collection.
   *
   * When enabled, documents will include a `deletedAt` timestamp field.
   * This allows documents to be marked as deleted without being permanently removed.
   * The `deletedAt` field will be set to the current date and time when a document is trashed.
   *
   * @default false
   */
  trash?: boolean
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
    | 'admin'
    | 'auth'
    | 'endpoints'
    | 'fields'
    | 'folder'
    | 'folders'
    | 'hierarchy'
    | 'slug'
    | 'upload'
    | 'versions'
  > {
  admin: CollectionAdminOptions
  auth: Auth
  endpoints: Endpoint[] | false
  fields: Field[]
  /**
   * Fields in the database schema structure
   * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
   */
  flattenedFields: FlattenedField[]
  /**
   * Hierarchy configuration (when collection is a hierarchy type like folders or tags)
   */
  hierarchy: false | SanitizedHierarchyConfig
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
  versions?: SanitizedCollectionVersions
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
    isPublic: boolean
    message: string
  }[]
}

export type AuthCollection = {
  config: SanitizedCollectionConfig
}

export type LocalizedMeta = {
  [locale: string]: {
    status: 'draft' | 'published'
    updatedAt: string
  }
}

export type TypeWithID = {
  id: number | string
}

export type TypeWithTimestamps = {
  [key: string]: unknown
  createdAt: string
  deletedAt?: null | string
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
