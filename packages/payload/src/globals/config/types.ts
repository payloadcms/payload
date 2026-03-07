/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { DeepRequired, IsAny } from 'ts-essentials'

import type {
  CustomPreviewButton,
  CustomSaveButton,
  CustomSaveDraftButton,
  CustomStatus,
  PublishButtonClientProps,
  PublishButtonServerProps,
  UnpublishButtonClientProps,
  UnpublishButtonServerProps,
} from '../../admin/types.js'
import type {
  Access,
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
import type { Field, FlattenedField } from '../../fields/config/types.js'
import type {
  GeneratedTypes,
  GlobalAdminCustom,
  GlobalCustom,
  GlobalSlug,
  RequestContext,
  TypedGlobal,
  TypedGlobalSelect,
} from '../../index.js'
import type { PayloadRequest, SelectIncludeType, Where } from '../../types/index.js'
import type { IncomingGlobalVersions, SanitizedGlobalVersions } from '../../versions/types.js'

export type DataFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobal[TSlug]

export type SelectFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobalSelect[TSlug]

/**
 * Global slugs that do not have drafts enabled.
 * Detects globals without drafts by checking for the absence of the `_status` field.
 */
export type GlobalsWithoutDrafts = {
  [TSlug in GlobalSlug]: DataFromGlobalSlug<TSlug> extends { _status?: any } ? never : TSlug
}[GlobalSlug]

/**
 * Conditionally allows or forbids the `draft` property based on global configuration.
 * When `strictDraftTypes` is enabled, the `draft` property is forbidden on globals without drafts.
 */
export type DraftFlagFromGlobalSlug<TSlug extends GlobalSlug> = GeneratedTypes extends {
  strictDraftTypes: true
}
  ? TSlug extends GlobalsWithoutDrafts
    ? {
        /**
         * The `draft` property is not allowed because this global does not have `versions.drafts` enabled.
         */
        draft?: never
      }
    : {
        /**
         * Whether the global should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
         */
        draft?: boolean
      }
  : {
      /**
       * Whether the global should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
       */
      draft?: boolean
    }

export type BeforeValidateHook = (args: {
  context: RequestContext
  data?: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
}) => any

export type BeforeChangeHook = (args: {
  context: RequestContext
  data: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  originalDoc?: any
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
}) => any

export type AfterChangeHook = (args: {
  context: RequestContext
  data: any
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  previousDoc: any
  req: PayloadRequest
}) => any

export type BeforeReadHook = (args: {
  context: RequestContext
  doc: any
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
}) => any

export type AfterReadHook = (args: {
  context: RequestContext
  doc: any
  findMany?: boolean
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  query?: Where
  req: PayloadRequest
}) => any

export type HookOperationType = 'countVersions' | 'read' | 'restoreVersion' | 'update'

export type BeforeOperationHook = (args: {
  args?: any
  context: RequestContext
  /**
   * The Global which this hook is being run on
   * */
  global: SanitizedGlobalConfig
  /**
   * Hook operation being performed
   */
  operation: HookOperationType
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
}) => any

export type GlobalAdminOptions = {
  /**
   * Custom admin components
   */
  components?: {
    elements?: {
      /**
       * Inject custom components before the document controls
       */
      beforeDocumentControls?: CustomComponent[]
      /**
       * Inject custom components before the document metadata (left of status/timestamps)
       */
      BeforeDocumentMeta?: CustomComponent[]
      Description?: EntityDescriptionComponent
      /**
       * Replaces the "Preview" button
       */
      PreviewButton?: CustomPreviewButton
      /**
       * Replaces the "Publish" button
       * + drafts must be enabled
       */
      PublishButton?: PayloadComponent<PublishButtonServerProps, PublishButtonClientProps>
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
      /**
       * Replaces the "Status" section
       */
      Status?: CustomStatus
      /**
       * Replaces the "Unpublish" button
       * + drafts must be enabled
       */
      UnpublishButton?: PayloadComponent<UnpublishButtonServerProps, UnpublishButtonClientProps>
    }
    views?: {
      /**
       * Set to a React component to replace the entire Edit View, including all nested routes.
       * Set to an object to replace or modify individual nested routes, or to add new ones.
       */
      edit?: EditConfig
    }
  }
  /** Extension point to add your custom data. Available in server and client. */
  custom?: GlobalAdminCustom
  /**
   * Custom description for collection
   */
  description?: EntityDescription
  /**
   * Specify a navigational group for globals in the admin sidebar.
   * - Provide a string to place the entity in a custom group.
   * - Provide a record to define localized group names.
   * - Set to `false` to exclude the entity from the sidebar / dashboard without disabling its routes.
   */
  group?: false | Record<string, string> | string
  /**
   * Exclude the global from the admin nav and routes
   */
  hidden?: ((args: { user: PayloadRequest['user'] }) => boolean) | boolean
  /**
   * Hide the API URL within the Edit View
   */
  hideAPIURL?: boolean
  /**
   * Live preview options
   */
  livePreview?: LivePreviewConfig
  meta?: MetaConfig
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
}

export type GlobalConfig<TSlug extends GlobalSlug = any> = {
  /**
   * Do not set this property manually. This is set to true during sanitization, to avoid
   * sanitizing the same global multiple times.
   */
  _sanitized?: boolean
  access?: {
    read?: Access
    readVersions?: Access
    update?: Access
  }
  admin?: GlobalAdminOptions
  /** Extension point to add your custom data. Server only. */
  custom?: GlobalCustom
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  endpoints?: false | Omit<Endpoint, 'root'>[]
  fields: Field[]
  /**
   * Specify which fields should be selected always, regardless of the `select` query which can be useful that the field exists for access control / hooks
   */
  forceSelect?: IsAny<SelectFromGlobalSlug<TSlug>> extends true
    ? SelectIncludeType
    : SelectFromGlobalSlug<TSlug>
  graphQL?:
    | {
        disableMutations?: true
        disableQueries?: true
        name?: string
      }
    | false
  hooks?: {
    afterChange?: AfterChangeHook[]
    afterRead?: AfterReadHook[]
    beforeChange?: BeforeChangeHook[]
    beforeOperation?: BeforeOperationHook[]
    beforeRead?: BeforeReadHook[]
    beforeValidate?: BeforeValidateHook[]
  }
  label?: LabelFunction | StaticLabel
  /**
   * Enables / Disables the ability to lock documents while editing
   * @default true
   */
  lockDocuments?:
    | {
        duration: number
      }
    | false
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
  versions?: boolean | IncomingGlobalVersions
}

export interface SanitizedGlobalConfig
  extends Omit<DeepRequired<GlobalConfig>, 'endpoints' | 'fields' | 'slug' | 'versions'> {
  endpoints: Endpoint[] | false
  fields: Field[]
  /**
   * Fields in the database schema structure
   * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
   */
  flattenedFields: FlattenedField[]
  slug: GlobalSlug
  versions?: SanitizedGlobalVersions
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
