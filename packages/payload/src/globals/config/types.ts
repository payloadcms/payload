import type { GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired } from 'ts-essentials'

import type { DatabaseAdapter } from '../../'
import type {
  CustomPreviewButtonProps,
  CustomPublishButtonType,
  CustomSaveButtonProps,
  CustomSaveDraftButtonProps,
} from '../../admin/components/elements/types'
import type { User } from '../../auth/types'
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
import type { Where } from '../../types'
import type { IncomingGlobalVersions, SanitizedGlobalVersions } from '../../versions/types'

export type TypeWithID = {
  id: number | string
}

export type BeforeValidateHook = (args: {
  context: RequestContext
  data?: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  req: PayloadRequest
}) => any

export type BeforeChangeHook = (args: {
  context: RequestContext
  data: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  req: PayloadRequest
}) => any

export type AfterChangeHook = (args: {
  context: RequestContext
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  previousDoc: any
  req: PayloadRequest
}) => any

export type BeforeReadHook = (args: {
  context: RequestContext
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  req: PayloadRequest
}) => any

export type AfterReadHook = (args: {
  context: RequestContext
  doc: any
  findMany?: boolean
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  query?: Where
  req: PayloadRequest
}) => any

export type GlobalAdminOptions = {
  /**
   * Custom admin components
   */
  components?: {
    elements?: {
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
                 * + `Default` - `/admin/globals/:slug`
                 * + `API` - `/admin/globals/:id/api`
                 * + `LivePreview` - `/admin/globals/:id/preview`
                 * + `References` - `/admin/globals/:id/references`
                 * + `Relationships` - `/admin/globals/:id/relationships`
                 * + `Versions` - `/admin/globals/:id/versions`
                 * + `Version` - `/admin/globals/:id/versions/:version`
                 * + `CustomView` - `/admin/globals/:id/:path`
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
                [name: string]: EditViewConfig
              }
          )
        | AdminViewComponent
    }
  }
  /**
   * Custom description for collection
   */
  description?: EntityDescription
  /**
   * Place globals into a navigational group
   * */
  group?: Record<string, string> | string
  /**
   * Exclude the global from the admin nav and routes
   */
  hidden?: ((args: { user: User }) => boolean) | boolean
  /**
   * Hide the API URL within the Edit view
   */
  hideAPIURL?: boolean
  /**
   * Live preview options
   */
  livePreview?: LivePreviewConfig
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
}

export type GlobalConfig = {
  access?: {
    read?: Access
    readDrafts?: Access
    readVersions?: Access
    update?: Access
  }
  admin?: GlobalAdminOptions
  /** Extension point to add your custom data. */
  custom?: Record<string, any>
  /**
   * Add a custom database adapter to this global.
   */
  db?:
    | DatabaseAdapter
    | Pick<
        DatabaseAdapter,
        | 'connect'
        | 'count'
        | 'create'
        | 'createGlobal'
        | 'createGlobalVersion'
        | 'createVersion'
        | 'deleteMany'
        | 'deleteOne'
        | 'deleteVersions'
        | 'find'
        | 'findGlobal'
        | 'findGlobalVersions'
        | 'findOne'
        | 'findVersions'
        | 'init'
        | 'queryDrafts'
        | 'updateGlobal'
        | 'updateGlobalVersion'
        | 'updateOne'
        | 'updateVersion'
      >
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  endpoints?: Omit<Endpoint, 'root'>[] | false
  fields: Field[]
  graphQL?:
    | {
        name?: string
      }
    | false
  hooks?: {
    afterChange?: AfterChangeHook[]
    afterRead?: AfterReadHook[]
    beforeChange?: BeforeChangeHook[]
    beforeRead?: BeforeReadHook[]
    beforeValidate?: BeforeValidateHook[]
  }
  label?: Record<string, string> | string
  slug: string
  /**
   * Options used in typescript generation
   */
  typescript?: {
    /**
     * Typescript generation name given to the interface type
     */
    interface?: string
  }
  versions?: IncomingGlobalVersions | boolean
}

export interface SanitizedGlobalConfig
  extends Omit<DeepRequired<GlobalConfig>, 'endpoints' | 'fields' | 'versions'> {
  endpoints: Omit<Endpoint, 'root'>[] | false
  fields: Field[]
  versions: SanitizedGlobalVersions
}

export type Globals = {
  config: SanitizedGlobalConfig[]
  graphQL?:
    | {
        [slug: string]: {
          mutationInputType: GraphQLNonNull<any>
          type: GraphQLObjectType
          versionType?: GraphQLObjectType
        }
      }
    | false
}
