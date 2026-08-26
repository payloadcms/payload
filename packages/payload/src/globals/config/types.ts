/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { IsAny } from 'ts-essentials'

import type {
  Access,
  Endpoint,
  EntityDescription,
  GeneratePreviewURL,
  LabelFunction,
  LivePreviewConfig,
  MetaConfig,
  SharedAdminComponents,
  StaticLabel,
} from '../../config/types.js'
import type { DBIdentifierName } from '../../database/types.js'
import type { Field, FlattenedField } from '../../fields/config/types.js'
import type {
  GeneratedTypes,
  GlobalAdminCustom,
  GlobalCustom,
  GlobalSlug,
  JsonObject,
  RequestContext,
  TypedGlobal,
  TypedGlobalSelect,
} from '../../index.js'
import type { PayloadRequest, SelectIncludeType, Where, WithSelectFn } from '../../types/index.js'
import type { RestoreAction, UpdateAction } from '../../versions/actions/types.js'
import type {
  IncomingGlobalVersions,
  ReadVersion,
  SanitizedGlobalVersions,
} from '../../versions/types.js'

export type DataFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobal[TSlug]

export type SelectFromGlobalSlug<TSlug extends GlobalSlug> = TypedGlobalSelect[TSlug]

type HasGeneratedGlobalTypes = 'globals' extends keyof GeneratedTypes ? true : false

/**
 * Helper type for draft data OUTPUT (e.g., query results) - makes user fields optional
 */
export type QueryDraftDataFromGlobal<TData extends JsonObject> = Partial<TData>

export type QueryDraftDataFromGlobalSlug<TSlug extends GlobalSlug> = QueryDraftDataFromGlobal<
  DataFromGlobalSlug<TSlug>
>

export type GlobalAccess<TData = any> = {
  read?: Access<TData>
  readVersions?: Access<TData>
  update?: Access<TData>
}

/**
 * Global slugs that do not have drafts enabled.
 * Detects globals without drafts by checking for the absence of the `_status` field.
 */
export type GlobalsWithoutDrafts = {
  [TSlug in GlobalSlug]: DataFromGlobalSlug<TSlug> extends { _status?: any } ? never : TSlug
}[GlobalSlug]

/**
 * Allows `version` on draft-enabled globals and forbids it on globals without drafts.
 */
export type VersionFromGlobalSlug<TSlug extends GlobalSlug> = HasGeneratedGlobalTypes extends false
  ? {
      /**
       * Which document representation to read. [More](https://payloadcms.com/docs/versions/drafts)
       *
       * @default 'published'
       */
      version?: ReadVersion
    }
  : TSlug extends GlobalsWithoutDrafts
    ? {
        /**
         * `version` is not allowed because this global does not have `versions.drafts` enabled.
         */
        version?: never
      }
    : {
        /**
         * Which document representation to read. [More](https://payloadcms.com/docs/versions/drafts)
         *
         * @default 'published'
         */
        version?: ReadVersion
      }

/**
 * Allows update `action` on draft-enabled globals. Non-draft globals may only omit it or pass `publish`.
 */
export type UpdateActionFromGlobalSlug<TSlug extends GlobalSlug> =
  HasGeneratedGlobalTypes extends false
    ? {
        action?: UpdateAction
      }
    : TSlug extends GlobalsWithoutDrafts
      ? {
          action?: 'publish'
        }
      : {
          action?: UpdateAction
        }

/**
 * Allows restore `action` on draft-enabled globals. Non-draft globals may only omit it or pass `publish`.
 * Restore does not accept `unpublish`. Omitted action publishes.
 */
export type RestoreActionFromGlobalSlug<TSlug extends GlobalSlug> =
  HasGeneratedGlobalTypes extends false
    ? {
        /**
         * Restore and publish (`publish`, default) or restore as a draft (`saveDraft`).
         */
        action?: RestoreAction
      }
    : TSlug extends GlobalsWithoutDrafts
      ? {
          action?: 'publish'
        }
      : {
          /**
           * Restore and publish (`publish`, default) or restore as a draft (`saveDraft`).
           */
          action?: RestoreAction
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
  /**
   * Resolved write action for this operation. `undefined` when drafts are not enabled.
   */
  action?: RestoreAction | UpdateAction
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
  /**
   * Only available on findGlobal reads.
   */
  version?: ReadVersion
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
  components?: SharedAdminComponents
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
   * Live preview options
   */
  livePreview?: LivePreviewConfig
  meta?: MetaConfig
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
}

type GlobalHooks = {
  afterChange?: AfterChangeHook[]
  afterRead?: AfterReadHook[]
  beforeChange?: BeforeChangeHook[]
  beforeOperation?: BeforeOperationHook[]
  beforeRead?: BeforeReadHook[]
  beforeValidate?: BeforeValidateHook[]
}

export type GlobalConfig<TSlug extends GlobalSlug = any> = {
  /**
   * Do not set this property manually. This is set to true during sanitization, to avoid
   * sanitizing the same global multiple times.
   */
  _sanitized?: boolean
  access?: GlobalAccess
  admin?: GlobalAdminOptions
  /** Extension point to add your custom data. Server only. */
  custom?: GlobalCustom
  /**
   * Customize the SQL table name
   */
  dbName?: DBIdentifierName
  endpoints?: false | Omit<Endpoint, 'root'>[]
  fields: Field[]
  graphQL?:
    | {
        disableMutations?: true
        disableQueries?: true
        name?: string
      }
    | false
  hooks?: GlobalHooks
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
} & Pick<
  WithSelectFn<
    IsAny<SelectFromGlobalSlug<TSlug>> extends true
      ? SelectIncludeType
      : SelectFromGlobalSlug<TSlug>
  >,
  'select'
>

export interface SanitizedGlobalConfig
  extends Omit<
      GlobalConfig,
      | '_sanitized'
      | 'access'
      | 'admin'
      | 'custom'
      | 'endpoints'
      | 'hooks'
      | 'label'
      | 'slug'
      | 'versions'
    >,
    Required<Pick<GlobalConfig, 'admin' | 'custom' | 'label'>> {
  _sanitized: true
  access: Pick<GlobalAccess, 'readVersions'> & Required<Pick<GlobalAccess, 'read' | 'update'>>
  endpoints: Endpoint[] | false
  /**
   * Fields in the database schema structure
   * Rows / collapsible / tabs w/o name `fields` merged to top, UIs are excluded
   */
  flattenedFields: FlattenedField[]
  hooks: Required<GlobalHooks>
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
