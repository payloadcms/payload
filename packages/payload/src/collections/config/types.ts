/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response } from 'express'
import type { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { Config as GeneratedTypes } from 'payload/generated-types'
import type { DeepRequired } from 'ts-essentials'

import type { DocumentTab } from '../../admin/components/elements/DocumentHeader/Tabs/types'
import type {
  CustomPreviewButtonProps,
  CustomPublishButtonProps,
  CustomSaveButtonProps,
  CustomSaveDraftButtonProps,
} from '../../admin/components/elements/types'
import type { Props as EditProps } from '../../admin/components/views/collections/Edit/types'
import type { Props as ListProps } from '../../admin/components/views/collections/List/types'
import type { Auth, IncomingAuthType, User } from '../../auth/types'
import type { Access, Endpoint, EntityDescription, GeneratePreviewURL } from '../../config/types'
import type { PayloadRequest, RequestContext } from '../../express/types'
import type { Field } from '../../fields/config/types'
import type { IncomingUploadType, Upload } from '../../uploads/types'
import type { IncomingCollectionVersions, SanitizedCollectionVersions } from '../../versions/types'
import type { AfterOperationArg, AfterOperationMap } from '../operations/utils'

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
  context: RequestContext
  /**
   * Hook operation being performed
   */
  operation: HookOperationType
}) => any

export type BeforeValidateHook<T extends TypeWithID = any> = (args: {
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
  req?: PayloadRequest
}) => any

export type BeforeChangeHook<T extends TypeWithID = any> = (args: {
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
  context: RequestContext
  doc: T
  query: { [key: string]: any }
  req: PayloadRequest
}) => any

export type AfterReadHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  doc: T
  findMany?: boolean
  query?: { [key: string]: any }
  req: PayloadRequest
}) => any

export type BeforeDeleteHook = (args: {
  context: RequestContext
  id: number | string
  req: PayloadRequest
}) => any

export type AfterDeleteHook<T extends TypeWithID = any> = (args: {
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
) => { response: any; status: number } | void

export type BeforeLoginHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  req: PayloadRequest
  user: T
}) => any

export type AfterLoginHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  req: PayloadRequest
  token: string
  user: T
}) => any

export type AfterLogoutHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  req: PayloadRequest
  res: Response
}) => any

export type AfterMeHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  req: PayloadRequest
  response: unknown
}) => any

export type AfterRefreshHook<T extends TypeWithID = any> = (args: {
  context: RequestContext
  exp: number
  req: PayloadRequest
  res: Response
  token: string
}) => any

export type AfterForgotPasswordHook = (args: { args?: any; context: RequestContext }) => any

type BeforeDuplicateArgs<T> = {
  data: T
  locale?: string
}

export type BeforeDuplicate<T = any> = (args: BeforeDuplicateArgs<T>) => Promise<T> | T

export type CollectionEditViewConfig = {
  /**
   * The component to render for this view
   * + Replaces the default component
   */
  Component: React.ComponentType<EditProps>
  Tab: DocumentTab
  path: string
}

export type CollectionEditView = CollectionEditViewConfig | React.ComponentType<EditProps>

export type CollectionAdminOptions = {
  /**
   * Custom admin components
   */
  components?: {
    AfterList?: React.ComponentType<ListProps>[]
    AfterListTable?: React.ComponentType<ListProps>[]
    BeforeList?: React.ComponentType<ListProps>[]
    BeforeListTable?: React.ComponentType<ListProps>[]
    /**
     * Components within the edit view
     */
    edit?: {
      /**
       * Replaces the "Preview" button
       */
      PreviewButton?: CustomPreviewButtonProps
      /**
       * Replaces the "Publish" button
       * + drafts must be enabled
       */
      PublishButton?: CustomPublishButtonProps
      /**
       * Replaces the "Save" button
       * + drafts must be disabled
       */
      SaveButton?: CustomSaveButtonProps
      /**
       * Replaces the "Save Draft" button
       * + drafts must be enabled
       * + autosave must be disabled
       */
      SaveDraftButton?: CustomSaveDraftButtonProps
    }
    views?: {
      /**
       * Replaces the "Edit" view entirely
       */
      Edit?:
        | {
            /**
             * Replaces or adds nested views within the "Edit" view
             * + `Default` - `/admin/collections/:collection/:id`
             * + `API` - `/admin/collections/:collection/:id/api`
             * + `Preview` - `/admin/collections/:collection/:id/preview`
             * + `References` - `/admin/collections/:collection/:id/references`
             * + `Relationships` - `/admin/collections/:collection/:id/relationships`
             * + `Versions` - `/admin/collections/:collection/:id/versions`
             * + `Version` - `/admin/collections/:collection/:id/versions/:version`
             * + `:path` - `/admin/collections/:collection/:id/:path`
             */
            Default: CollectionEditView
            Versions?: CollectionEditView
            // TODO: uncomment these as they are built
            // [key: string]: CollectionEditView
            // API?: CollectionEditView
            // Preview?: CollectionEditView
            // References?: CollectionEditView
            // Relationships?: CollectionEditView
            // Version: CollectionEditView
          }
        | React.ComponentType<EditProps>
      List?: React.ComponentType<ListProps>
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
  disableDuplicate?: boolean
  enableRichTextLink?: boolean
  enableRichTextRelationship?: boolean
  /**
   * Place collections into a navigational group
   * */
  group?: Record<string, string> | string
  /**
   * Exclude the collection from the admin nav and routes
   */
  hidden?: ((args: { user: User }) => boolean) | boolean
  /**
   * Hide the API URL within the Edit view
   */
  hideAPIURL?: boolean
  hooks?: {
    /**
     * Function that allows you to modify a document's data before it is duplicated
     */
    beforeDuplicate?: BeforeDuplicate
  }
  /**
   * Additional fields to be searched via the full text search
   */
  listSearchableFields?: string[]
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
    admin?: (args?: any) => Promise<boolean> | boolean
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
   * Array of database indexes to create, including compound indexes that have multiple fields
   */
  indexes?: TypeOfIndex[]
  /**
   * Label configuration
   */
  labels?: {
    plural?: Record<string, string> | string
    singular?: Record<string, string> | string
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
  upload?: IncomingUploadType | boolean
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
  endpoints: Omit<Endpoint, 'root'>[] | false
  fields: Field[]
  upload: Upload
  versions: SanitizedCollectionVersions
}

export type Collection = {
  config: SanitizedCollectionConfig
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

type IndexDirection =
  | '2d'
  | '2dsphere'
  | 'asc'
  | 'ascending'
  | 'desc'
  | 'descending'
  | 'geoHaystack'
  | 'hashed'
  | 'text'
  | -1
  | 1

type IndexOptions = {
  '2dsphereIndexVersion'?: number
  /** Creates the index in the background, yielding whenever possible. */
  background?: boolean
  bits?: number
  bucketSize?: number
  /** (MongoDB 4.4. or higher) Specifies how many data-bearing members of a replica set, including the primary, must complete the index builds successfully before the primary marks the indexes as ready. This option accepts the same values for the "w" field in a write concern plus "votingMembers", which indicates all voting data-bearing nodes. */
  commitQuorum?: number | string
  default_language?: string
  /** Allows you to expire data on indexes applied to a data (MongoDB 2.2 or higher) */
  expireAfterSeconds?: number
  expires?: number | string
  /** Specifies that the index should exist on the target collection but should not be used by the query planner when executing operations. (MongoDB 4.4 or higher) */
  hidden?: boolean
  language_override?: string
  /** For geospatial indexes set the high bound for the co-ordinates. */
  max?: number
  /** For geospatial indexes set the lower bound for the co-ordinates. */
  min?: number
  /** Override the autogenerated index name (useful if the resulting name is larger than 128 bytes) */
  name?: string
  /** Creates a sparse index. */
  sparse?: boolean
  textIndexVersion?: number
  /** Creates an unique index. */
  unique?: boolean
  /** Specifies the index version number, either 0 or 1. */
  version?: number
  weights?: Record<string, number>
}

export type TypeOfIndex = {
  fields: Record<string, IndexDirection>
  options?: IndexOptions
}
