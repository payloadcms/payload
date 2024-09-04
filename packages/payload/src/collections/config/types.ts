/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Response } from 'express'
import type { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired } from 'ts-essentials'

import type { DatabaseAdapter, GeneratedTypes } from '../../'
import type {
  CustomPreviewButtonProps,
  CustomPublishButtonType,
  CustomSaveButtonProps,
  CustomSaveDraftButtonProps,
} from '../../admin/components/elements/types'
import type { Props as ListProps } from '../../admin/components/views/collections/List/types'
import type { Arguments as MeArguments } from '../../auth/operations/me'
import type {
  Arguments as RefreshArguments,
  Result as RefreshResult,
} from '../../auth/operations/refresh'
import type { Auth, IncomingAuthType, User } from '../../auth/types'
import type {
  Access,
  AdminViewComponent,
  EditViewConfig,
  Endpoint,
  EntityDescription,
  GeneratePreviewURL,
  LivePreviewConfig,
} from '../../config/types'
import type { DBIdentifierName } from '../../database/types'
import type { PayloadRequest, RequestContext } from '../../express/types'
import type { Field } from '../../fields/config/types'
import type { IncomingUploadType, Upload } from '../../uploads/types'
import type { IncomingCollectionVersions, SanitizedCollectionVersions } from '../../versions/types'
import type { AfterOperationArg, AfterOperationMap } from '../operations/utils'

export type HookOperationType =
  | 'autosave'
  | 'count'
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
  query: {
    [key: string]: any
  }
  req: PayloadRequest
}) => any

export type AfterReadHook<T extends TypeWithID = any> = (args: {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  findMany?: boolean
  query?: {
    [key: string]: any
  }
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
) => {
  response: any
  status: number
} | void

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
  res: Response
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
  res: Response
  token: string
}) => any

export type AfterForgotPasswordHook = (args: {
  args?: any
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
}) => any

type BeforeDuplicateArgs<T> = {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  data: T
  locale?: string
}

export type BeforeDuplicate<T = any> = (args: BeforeDuplicateArgs<T>) => Promise<T> | T

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
      PublishButton?: CustomPublishButtonType
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
       * Set to a React component to replace the entire "Edit" view, including all nested routes.
       * Set to an object to replace or modify individual nested routes, or to add new ones.
       */
      Edit?:
        | (
            | {
                /**
                 * Replace or modify individual nested routes, or add new ones:
                 * + `Default` - `/admin/collections/:collection/:id`
                 * + `API` - `/admin/collections/:collection/:id/api`
                 * + `LivePreview` - `/admin/collections/:collection/:id/preview`
                 * + `References` - `/admin/collections/:collection/:id/references`
                 * + `Relationships` - `/admin/collections/:collection/:id/relationships`
                 * + `Versions` - `/admin/collections/:collection/:id/versions`
                 * + `Version` - `/admin/collections/:collection/:id/versions/:version`
                 * + `CustomView` - `/admin/collections/:collection/:id/:path`
                 */
                API?: AdminViewComponent | Partial<EditViewConfig>
                Default?: AdminViewComponent | Partial<EditViewConfig>
                LivePreview?: AdminViewComponent | Partial<EditViewConfig>
                Version?: AdminViewComponent | Partial<EditViewConfig>
                Versions?: AdminViewComponent | Partial<EditViewConfig>
                // TODO: uncomment these as they are built
                // References?: EditView
                // Relationships?: EditView
              }
            | {
                [key: string]: EditViewConfig
              }
          )
        | AdminViewComponent
      List?:
        | {
            Component?: React.ComponentType<ListProps>
            actions?: React.ComponentType<any>[]
          }
        | React.ComponentType<ListProps>
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
   * Add a custom database adapter to this collection.
   */
  db?: Pick<
    DatabaseAdapter,
    'create' | 'deleteMany' | 'deleteOne' | 'find' | 'findOne' | 'updateOne'
  >
  /**
   * Used to override the default naming of the database table or collection with your using a function or string
   * @WARNING: If you change this property with existing data, you will need to handle the renaming of the table in your database or by using migrations
   */
  dbName?: DBIdentifierName
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
    countType: GraphQLObjectType
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
