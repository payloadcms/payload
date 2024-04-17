import type { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired } from 'ts-essentials'

import type {
  CustomPreviewButton,
  CustomPublishButton,
  CustomSaveButton,
  CustomSaveDraftButton,
} from '../../admin/types.js'
import type { Auth, ClientUser, IncomingAuthType } from '../../auth/types.js'
import type {
  Access,
  CustomComponent,
  EditConfig,
  Endpoint,
  EntityDescription,
  GeneratePreviewURL,
  LabelFunction,
  LivePreviewConfig,
} from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { GeneratedTypes } from '../../index.js'
import type { PayloadRequest, RequestContext } from '../../types/index.js'
import type { SanitizedUploadConfig, UploadConfig } from '../../uploads/types.js'
import type {
  IncomingCollectionVersions,
  SanitizedCollectionVersions,
} from '../../versions/types.js'
import type { AfterOperationArg, AfterOperationMap } from '../operations/utils.js'

export type HookOperationType =
  | 'autosave'
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

export type AfterOperationHook<T extends TypeWithID = any> = (
  arg: AfterOperationArg<T>,
) => Promise<ReturnType<AfterOperationMap<T>[keyof AfterOperationMap<T>]>>

export type AfterErrorHook = (
  err: Error,
  res: unknown,
  context: RequestContext,
  /** The collection which this hook is being run on. This is null if the AfterError hook was be added to the payload-wide config */
  collection: SanitizedCollectionConfig | null,
) => { response: any; status: number } | void

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

export type AfterRefreshHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  exp: number
  req: PayloadRequest
  token: string
}) => any

export type AfterForgotPasswordHook = (args: {
  args?: any
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
}) => any

export type CollectionAdminOptions = {
  /**
   * Custom admin components
   */
  components?: {
    AfterList?: CustomComponent[]
    AfterListTable?: CustomComponent[]
    BeforeList?: CustomComponent[]
    BeforeListTable?: CustomComponent[]
    /**
     * Components within the edit view
     */
    edit?: {
      /**
       * Replaces the "Preview" button
       */
      PreviewButton?: CustomPreviewButton
      /**
       * Replaces the "Publish" button
       * + drafts must be enabled
       */
      PublishButton?: CustomPublishButton
      /**
       * Replaces the "Save" button
       * + drafts must be disabled
       */
      SaveButton?: CustomSaveButton
      /**
       * Replaces the "Save Draft" button
       * + drafts must be enabled
       * + autosave must be disabled
       */
      SaveDraftButton?: CustomSaveDraftButton
    }
    views?: {
      /**
       * Set to a React component to replace the entire "Edit" view, including all nested routes.
       * Set to an object to replace or modify individual nested routes, or to add new ones.
       */
      Edit?: EditConfig
      List?:
        | {
            Component?: React.ComponentType<any>
            actions?: CustomComponent[]
          }
        | React.ComponentType<any>
    }
  }
  /**
   * Default columns to show in list view
   */
  defaultColumns?: string[]
  /**
   * Custom description for collection
   */
  description?: EntityDescription
  enableRichTextLink?: boolean
  enableRichTextRelationship?: boolean
  /**
   * Place collections into a navigational group
   * */
  group?: Record<string, string> | string
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
  pagination?: {
    defaultLimit?: number
    limits?: number[]
  }
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
  /**
   * Field to use as title in Edit view and first column in List view
   */
  useAsTitle?: string
}

/** Manage all aspects of a data collection */
export type CollectionConfig = {
  /**
   * Access control
   */
  access?: {
    admin?: ({ req }: { req: PayloadRequest }) => Promise<boolean> | boolean
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
  auth?: IncomingAuthType | boolean
  /** Extension point to add your custom data. */
  custom?: Record<string, any>
  /**
   * Default field to sort by in collection list view
   */
  defaultSort?: string
  /**
   * When true, do not show the "Duplicate" button while editing documents within this collection and prevent `duplicate` from all APIs
   */
  disableDuplicate?: boolean
  /**
   * Custom rest api endpoints, set false to disable all rest endpoints for this collection.
   */
  endpoints?: Omit<Endpoint, 'root'>[] | false
  fields: Field[]
  /**
   * GraphQL configuration
   */
  graphQL?:
    | {
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
    afterError?: AfterErrorHook
    afterForgotPassword?: AfterForgotPasswordHook[]
    afterLogin?: AfterLoginHook[]
    afterLogout?: AfterLogoutHook[]
    afterMe?: AfterMeHook[]
    afterOperation?: AfterOperationHook[]
    afterRead?: AfterReadHook[]
    afterRefresh?: AfterRefreshHook[]
    beforeChange?: BeforeChangeHook[]
    beforeDelete?: BeforeDeleteHook[]
    beforeLogin?: BeforeLoginHook[]
    beforeOperation?: BeforeOperationHook[]
    beforeRead?: BeforeReadHook[]
    beforeValidate?: BeforeValidateHook[]
  }
  /**
   * Label configuration
   */
  labels?: {
    plural?: LabelFunction | Record<string, string> | string
    singular?: LabelFunction | Record<string, string> | string
  }
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
  upload?: UploadConfig | boolean
  /**
   * Customize the handling of incoming file uploads
   *
   * @default false // disable versioning
   */
  versions?: IncomingCollectionVersions | boolean
}

export interface SanitizedCollectionConfig
  extends Omit<
    DeepRequired<CollectionConfig>,
    'auth' | 'endpoints' | 'fields' | 'upload' | 'versions'
  > {
  auth: Auth
  endpoints: Endpoint[] | false
  fields: Field[]
  upload: SanitizedUploadConfig
  versions: SanitizedCollectionVersions
}

export type Collection = {
  config: SanitizedCollectionConfig
  customIDType?: 'number' | 'text'
  graphQL?: {
    JWT: GraphQLObjectType
    mutationInputType: GraphQLNonNull<any>
    paginatedType: GraphQLObjectType
    type: GraphQLObjectType
    updateMutationInputType: GraphQLNonNull<any>
    versionType: GraphQLObjectType
    whereInputType: GraphQLInputObjectType
  }
}

export type BulkOperationResult<TSlug extends keyof GeneratedTypes['collections']> = {
  docs: GeneratedTypes['collections'][TSlug][]
  errors: {
    id: GeneratedTypes['collections'][TSlug]['id']
    message: string
  }[]
}

export type AuthCollection = {
  config: SanitizedCollectionConfig
}

export type TypeWithID = {
  id: number | string
}

export type TypeWithTimestamps = {
  [key: string]: unknown
  createdAt: string
  id: number | string
  updatedAt: string
}
