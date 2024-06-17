import type { GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired } from 'ts-essentials'

import type {
  CustomPreviewButton,
  CustomPublishButton,
  CustomSaveButton,
  CustomSaveDraftButton,
} from '../../admin/types.js'
import type {
  Access,
  EditConfig,
  Endpoint,
  EntityDescription,
  EntityDescriptionComponent,
  GeneratePreviewURL,
  LivePreviewConfig,
  OpenGraphConfig,
} from '../../config/types.js'
import type { DBIdentifierName } from '../../database/types.js'
import type { Field } from '../../fields/config/types.js'
import type { PayloadRequestWithData, RequestContext, Where } from '../../types/index.js'
import type { IncomingGlobalVersions, SanitizedGlobalVersions } from '../../versions/types.js'

export type TypeWithID = {
  id: number | string
}

export type BeforeValidateHook = (args: {
  context: RequestContext
  data?: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  req: PayloadRequestWithData
}) => any

export type BeforeChangeHook = (args: {
  context: RequestContext
  data: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  req: PayloadRequestWithData
}) => any

export type AfterChangeHook = (args: {
  context: RequestContext
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  previousDoc: any
  req: PayloadRequestWithData
}) => any

export type BeforeReadHook = (args: {
  context: RequestContext
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  req: PayloadRequestWithData
}) => any

export type AfterReadHook = (args: {
  context: RequestContext
  doc: any
  findMany?: boolean
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  query?: Where
  req: PayloadRequestWithData
}) => any

export type GlobalAdminOptions = {
  /**
   * Custom admin components
   */
  components?: {
    elements?: {
      Description?: EntityDescriptionComponent
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
    }
  }
  /** Extension point to add your custom data. Available in server and client. */
  custom?: Record<string, any>
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
  hidden?: ((args: { user: PayloadRequestWithData['user'] }) => boolean) | boolean
  /**
   * Hide the API URL within the Edit view
   */
  hideAPIURL?: boolean
  /**
   * Live preview options
   */
  livePreview?: LivePreviewConfig
  meta?: {
    description?: string
    openGraph?: OpenGraphConfig
  }
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
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
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
  endpoints: Endpoint[] | false
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
