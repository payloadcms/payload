import type {
  DefaultTranslationKeys,
  DefaultTranslationsObject,
  I18n,
  I18nClient,
  I18nOptions,
  TFunction,
} from '@payloadcms/translations'
import type { BusboyConfig } from 'busboy'
import type GraphQL from 'graphql'
import type { GraphQLFormattedError } from 'graphql'
import type { JSONSchema4 } from 'json-schema'
import type { Metadata } from 'next'
import type { DestinationStream, Level, LoggerOptions } from 'pino'
import type React from 'react'
import type { default as sharp } from 'sharp'
import type { DeepRequired } from 'ts-essentials'

import type { RichTextAdapterProvider } from '../admin/RichText.js'
import type {
  DocumentSubViewTypes,
  DocumentTabConfig,
  DocumentViewServerProps,
  RichTextAdapter,
} from '../admin/types.js'
import type { AdminViewConfig, ViewTypes, VisibleEntities } from '../admin/views/index.js'
import type { SanitizedPermissions } from '../auth/index.js'
import type {
  AddToImportMap,
  ImportMap,
  Imports,
  InternalImportMap,
} from '../bin/generateImportMap/index.js'
import type {
  Collection,
  CollectionConfig,
  SanitizedCollectionConfig,
} from '../collections/config/types.js'
import type { DatabaseAdapterResult } from '../database/types.js'
import type { EmailAdapter, SendEmailOptions } from '../email/types.js'
import type { ErrorName } from '../errors/types.js'
import type { RootFoldersConfiguration } from '../folders/types.js'
import type { GlobalConfig, Globals, SanitizedGlobalConfig } from '../globals/config/types.js'
import type {
  Block,
  DefaultDocumentIDType,
  FlattenedBlock,
  JobsConfig,
  KVAdapterResult,
  Payload,
  RequestContext,
  SelectField,
  TypedUser,
} from '../index.js'
import type { QueryPreset, QueryPresetConstraints } from '../query-presets/types.js'
import type { SanitizedJobsConfig } from '../queues/config/types/index.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type { PayloadLogger } from '../utilities/logger.js'

/**
 * The string path pointing to the React component. If one of the generics is `never`, you effectively mark it as a server-only or client-only component.
 *
 * If it is `false` an empty component will be rendered.
 */
export type PayloadComponent<
  TComponentServerProps extends never | object = Record<string, any>,
  TComponentClientProps extends never | object = Record<string, any>,
> = false | RawPayloadComponent<TComponentServerProps, TComponentClientProps> | string

// We need the actual object as its own type, otherwise the infers for the PayloadClientReactComponent / PayloadServerReactComponent will not work due to the string union.
// We also NEED to actually use those generics for this to work, thus they are part of the props.
export type RawPayloadComponent<
  TComponentServerProps extends never | object = Record<string, any>,
  TComponentClientProps extends never | object = Record<string, any>,
> = {
  clientProps?: object | TComponentClientProps
  exportName?: string
  path: string
  serverProps?: object | TComponentServerProps
}

export type PayloadComponentProps<TPayloadComponent> =
  TPayloadComponent extends RawPayloadComponent<
    infer TComponentServerProps,
    infer TComponentClientProps
  >
    ? TComponentClientProps | TComponentServerProps
    : never

export type PayloadClientComponentProps<TPayloadComponent> =
  TPayloadComponent extends RawPayloadComponent<infer _, infer TComponentClientProps>
    ? TComponentClientProps
    : never

export type PayloadServerComponentProps<TPayloadComponent> =
  TPayloadComponent extends RawPayloadComponent<infer TComponentServerProps, infer _>
    ? TComponentServerProps
    : never

export type PayloadReactComponent<TPayloadComponent> = React.FC<
  PayloadComponentProps<TPayloadComponent>
>

// This also ensures that if never is passed to TComponentClientProps, this entire type will be never.
// => TypeScript will now ensure that users cannot even define the typed Server Components if the PayloadComponent is marked as
// Client-Only (marked as Client-Only = TComponentServerProps is never)
export type PayloadClientReactComponent<TPayloadComponent> =
  TPayloadComponent extends RawPayloadComponent<infer _, infer TComponentClientProps>
    ? TComponentClientProps extends never
      ? never
      : React.FC<TComponentClientProps>
    : never

export type PayloadServerReactComponent<TPayloadComponent> =
  TPayloadComponent extends RawPayloadComponent<infer TComponentServerProps, infer _>
    ? TComponentServerProps extends never
      ? never
      : React.FC<TComponentServerProps>
    : never

export type ResolvedComponent<
  TComponentServerProps extends never | object,
  TComponentClientProps extends never | object,
> = {
  clientProps?: TComponentClientProps
  Component: React.FC<TComponentClientProps | TComponentServerProps>
  serverProps?: TComponentServerProps
}

export type BinScriptConfig = {
  key: string
  scriptPath: string
}

export type BinScript = (config: SanitizedConfig) => Promise<void> | void

type Prettify<T> = {
  [K in keyof T]: T[K]
} & NonNullable<unknown>

export type Plugin = (config: Config) => Config | Promise<Config>

export type LivePreviewURLType = null | string | undefined

export type LivePreviewConfig = {
  /**
   Device breakpoints to use for the `iframe` of the Live Preview window.
   Options are displayed in the Live Preview toolbar.
   The `responsive` breakpoint is included by default.
   */
  breakpoints?: {
    height: number | string
    label: string
    name: string
    width: number | string
  }[]
  /**
   * The URL of the frontend application. This will be rendered within an `iframe` as its `src`.
   * Payload will send a `window.postMessage()` to this URL with the document data in real-time.
   * The frontend application is responsible for receiving the message and updating the UI accordingly.
   * @see https://payloadcms.com/docs/live-preview/frontend
   *
   * To conditionally render Live Preview, use a function that returns `undefined` or `null`.
   *
   * Note: this function may run often if autosave is enabled with a small interval.
   * For performance, avoid long-running tasks or expensive operations within this function,
   * or if you need to do something more complex, cache your function as needed.
   */
  url?:
    | ((args: {
        collectionConfig?: SanitizedCollectionConfig
        data: Record<string, any>
        globalConfig?: SanitizedGlobalConfig
        locale: Locale
        /**
         * @deprecated
         * Use `req.payload` instead. This will be removed in the next major version.
         */
        payload: Payload
        req: PayloadRequest
      }) => LivePreviewURLType | Promise<LivePreviewURLType>)
    | LivePreviewURLType
}

export type RootLivePreviewConfig = {
  collections?: string[]
  globals?: string[]
} & LivePreviewConfig

export type OGImageConfig = {
  alt?: string
  height?: number | string
  type?: string
  url: string
  width?: number | string
}

/**
 * @todo find a way to remove the deep clone here.
 * It can probably be removed after the `DeepRequired` from `Config` to `SanitizedConfig` is removed.
 * Same with `CollectionConfig` to `SanitizedCollectionConfig`.
 */
type DeepClone<T> = T extends object ? { [K in keyof T]: DeepClone<T[K]> } : T

export type MetaConfig = {
  /**
   * When `static`, a pre-made image will be used for all pages.
   * When `dynamic`, a unique image will be generated for each page based on page content and given overrides.
   * When `off`, no Open Graph images will be generated and the `/api/og` endpoint will be disabled. You can still provide custom images using the `openGraph.images` property.
   * @default 'dynamic'
   */
  defaultOGImageType?: 'dynamic' | 'off' | 'static'
  /**
   * String to append to the auto-generated <title> of admin pages
   * @example `" - Custom CMS"`
   */
  titleSuffix?: string
} & DeepClone<Metadata>

export type ServerOnlyLivePreviewProperties = keyof Pick<RootLivePreviewConfig, 'url'>

type GeneratePreviewURLOptions = {
  locale: string
  req: PayloadRequest
  token: null | string
}

export type GeneratePreviewURL = (
  doc: Record<string, unknown>,
  options: GeneratePreviewURLOptions,
) => null | Promise<null | string> | string

export type GraphQLInfo = {
  collections: {
    [slug: string]: Collection
  }
  globals: Globals
  Mutation: {
    fields: Record<string, any>
    name: string
  }
  Query: {
    fields: Record<string, any>
    name: string
  }
  types: {
    arrayTypes: Record<string, GraphQL.GraphQLType>
    blockInputTypes: Record<string, GraphQL.GraphQLInputObjectType>
    blockTypes: Record<string, GraphQL.GraphQLObjectType>
    fallbackLocaleInputType?: GraphQL.GraphQLEnumType | GraphQL.GraphQLScalarType
    groupTypes: Record<string, GraphQL.GraphQLObjectType>
    localeInputType?: GraphQL.GraphQLEnumType | GraphQL.GraphQLScalarType
    tabTypes: Record<string, GraphQL.GraphQLObjectType>
  }
}
export type GraphQLExtension = (
  graphQL: typeof GraphQL,
  context: {
    config: SanitizedConfig
  } & GraphQLInfo,
) => Record<string, unknown>

export type InitOptions = {
  /**
   * Sometimes, with the local API, you might need to pass a config file directly, for example, serverless on Vercel
   * The passed config should match the config file, and if it doesn't, there could be mismatches between the admin UI
   * and the backend functionality
   */
  config: Promise<SanitizedConfig> | SanitizedConfig
  /**
   * If set to `true`, payload will initialize crons for things like autorunning jobs on initialization.
   *
   * @default false
   */
  cron?: boolean

  /**
   * Disable connect to the database on init
   */
  disableDBConnect?: boolean

  /**
   * Disable running of the `onInit` function
   */
  disableOnInit?: boolean

  importMap?: ImportMap

  /**
   * A function that is called immediately following startup that receives the Payload instance as it's only argument.
   */
  onInit?: (payload: Payload) => Promise<void> | void
}

/**
 * This result is calculated on the server
 * and then sent to the client allowing the dashboard to show accessible data and actions.
 *
 * If the result is `true`, the user has access.
 * If the result is an object, it is interpreted as a MongoDB query.
 *
 * @example `{ createdBy: { equals: id } }`
 *
 * @example `{ tenant: { in: tenantIds } }`
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type AccessResult = boolean | Where

export type AccessArgs<TData = any> = {
  /**
   * The relevant resource that is being accessed.
   *
   * `data` is null when a list is requested
   */
  data?: TData
  /** ID of the resource being accessed */
  id?: DefaultDocumentIDType
  /** If true, the request is for a static file */
  isReadingStaticFile?: boolean
  /** The original request that requires an access check */
  req: PayloadRequest
}

/**
 * Access function runs on the server
 * and is sent to the client allowing the dashboard to show accessible data and actions.
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type Access<TData = any> = (args: AccessArgs<TData>) => AccessResult | Promise<AccessResult>

/** Web Request/Response model, but the req has more payload specific properties added to it. */
export type PayloadHandler = (req: PayloadRequest) => Promise<Response> | Response

/**
 * Docs: https://payloadcms.com/docs/rest-api/overview#custom-endpoints
 */
export type Endpoint = {
  /** Extension point to add your custom data. */
  custom?: Record<string, any>

  /**
   * Middleware that will be called when the path/method matches
   *
   * Compatible with Web Request/Response Model
   */
  handler: PayloadHandler
  /** HTTP method */
  method: 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put'
  /**
   * Pattern that should match the path of the incoming request
   *
   * Compatible with the Express router
   */
  path: string
  /**
   * Please add "root" routes under the /api folder in the Payload Project.
   * https://nextjs.org/docs/app/api-reference/file-conventions/route
   *
   * @deprecated in 3.0
   */
  root?: never
}

/**
 * @deprecated
 * This type will be renamed in v4.
 * Use `DocumentViewComponent` instead.
 */
export type EditViewComponent = DocumentViewComponent

export type DocumentViewComponent = PayloadComponent<DocumentViewServerProps>

/**
 * @deprecated
 * This type will be renamed in v4.
 * Use `DocumentViewConfig` instead.
 */
export type EditViewConfig = DocumentViewConfig

type BaseDocumentViewConfig = {
  actions?: CustomComponent[]
  meta?: MetaConfig
  tab?: DocumentTabConfig
}

/*
  If your view does not originate from a "known" key, e.g. `myCustomView`, then it is considered a "custom" view and can accept a `path`, etc.
  To render just a tab component without an accompanying view, you can omit the `path` and `Component` properties altogether.
*/
export type CustomDocumentViewConfig =
  | ({
      Component: DocumentViewComponent
      path: `/${string}`
    } & BaseDocumentViewConfig)
  | ({
      Component?: DocumentViewComponent
      path?: never
    } & BaseDocumentViewConfig)

/*
  If your view does originates from a "known" key, e.g. `api`, then it is considered a "default" view and cannot accept a `path`, etc.
*/
export type DefaultDocumentViewConfig = {
  Component?: DocumentViewComponent
} & BaseDocumentViewConfig

export type DocumentViewConfig = CustomDocumentViewConfig | DefaultDocumentViewConfig

export type Params = { [key: string]: string | string[] | undefined }

export type ServerProps = {
  readonly documentSubViewType?: DocumentSubViewTypes
  readonly i18n: I18nClient
  readonly id?: number | string
  readonly locale?: Locale
  readonly params?: Params
  readonly payload: Payload
  readonly permissions?: SanitizedPermissions
  readonly searchParams?: Params
  readonly user?: TypedUser
  readonly viewType?: ViewTypes
  readonly visibleEntities?: VisibleEntities
}

export const serverProps: (keyof ServerProps)[] = [
  'payload',
  'i18n',
  'locale',
  'params',
  'permissions',
  'searchParams',
  'permissions',
]

export type Timezone = {
  label: string
  value: string
}

type SupportedTimezonesFn = (args: { defaultTimezones: Timezone[] }) => Timezone[]

export type TimezonesConfig = {
  /**
   * The default timezone to use for the admin panel.
   */
  defaultTimezone?: string
  /**
   * Provide your own list of supported timezones for the admin panel
   *
   * Values should be IANA timezone names, eg. `America/New_York`
   *
   * We use `@date-fns/tz` to handle timezones
   */
  supportedTimezones?: SupportedTimezonesFn | Timezone[]
}

type SanitizedTimezoneConfig = {
  supportedTimezones: Timezone[]
} & Omit<TimezonesConfig, 'supportedTimezones'>

export type CustomComponent<TAdditionalProps extends object = Record<string, any>> =
  PayloadComponent<ServerProps & TAdditionalProps, TAdditionalProps>

export type Locale = {
  /**
   * value of supported locale
   * @example "en"
   */
  code: string
  /**
   * Code of another locale to use when reading documents with fallback, if not specified defaultLocale is used
   */
  fallbackLocale?: string | string[]
  /**
   * label of supported locale
   * @example "English"
   */
  label: Record<string, string> | string
  /**
   * if true, defaults textAligmnent on text fields to RTL
   */
  rtl?: boolean
}

export type BaseLocalizationConfig = {
  /**
   * Locale for users that have not expressed their preference for a specific locale
   * @example `"en"`
   */
  defaultLocale: string
  /**
   * Change the locale used by the default Publish button.
   * If set to `all`, all locales will be published.
   * If set to `active`, only the locale currently being edited will be published.
   * The non-default option will be available via the secondary button.
   * @default 'all'
   */
  defaultLocalePublishOption?: 'active' | 'all'
  /** Set to `true` to let missing values in localised fields fall back to the values in `defaultLocale`
   *
   * If false, then no requests will fallback unless a fallbackLocale is specified in the request.
   * @default true
   */
  fallback?: boolean
  /**
   * Define a function to filter the locales made available in Payload admin UI
   * based on user.
   */
  filterAvailableLocales?: (args: {
    locales: Locale[]
    req: PayloadRequest
  }) => Locale[] | Promise<Locale[]>
}

export type LocalizationConfigWithNoLabels = Prettify<
  {
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    locales: string[]
  } & BaseLocalizationConfig
>

export type LocalizationConfigWithLabels = Prettify<
  {
    /**
     * List of supported locales with labels
     * @example {
     *  label: 'English',
     *  value: 'en',
     *  rtl: false
     * }
     */
    locales: Locale[]
  } & BaseLocalizationConfig
>

export type SanitizedLocalizationConfig = Prettify<
  {
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    localeCodes: string[]
  } & LocalizationConfigWithLabels
>

/**
 * @see https://payloadcms.com/docs/configuration/localization#localization
 */
export type LocalizationConfig = Prettify<
  LocalizationConfigWithLabels | LocalizationConfigWithNoLabels
>

export type LabelFunction<TTranslationKeys = DefaultTranslationKeys> = (args: {
  i18n: I18nClient
  t: TFunction<TTranslationKeys>
}) => string

export type StaticLabel = Record<string, string> | string

export type SharpDependency = (
  input?:
    | ArrayBuffer
    | Buffer
    | Float32Array
    | Float64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | string
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array,
  options?: sharp.SharpOptions,
) => sharp.Sharp

export type CORSConfig = {
  headers?: string[]
  origins: '*' | string[]
}

export type AdminFunction = {
  args?: object
  path: string
  type: 'function'
}

export type AdminComponent = {
  clientProps?: object
  path: string
  serverProps?: object
  type: 'component'
}

export interface AdminDependencies {
  [key: string]: AdminComponent | AdminFunction
}

export type FetchAPIFileUploadOptions = {
  /**
   * Returns a HTTP 413 when the file is bigger than the size limit if `true`.
   * Otherwise, it will add a `truncated = true` to the resulting file structure.
   * @default false
   */
  abortOnLimit?: boolean | undefined
  /**
   * Automatically creates the directory path specified in `.mv(filePathName)`
   * @default false
   */
  createParentPath?: boolean | undefined
  /**
   * Turn on/off upload process logging. Can be useful for troubleshooting.
   * @default false
   */
  debug?: boolean | undefined
  /**
   * User defined limit handler which will be invoked if the file is bigger than configured limits.
   * @default false
   */
  limitHandler?: ((args: { request: Request; size: number }) => void) | boolean | undefined
  /**
   * By default, `req.body` and `req.files` are flattened like this:
   * `{'name': 'John', 'hobbies[0]': 'Cinema', 'hobbies[1]': 'Bike'}
   *
   * When this option is enabled they are parsed in order to be nested like this:
   * `{'name': 'John', 'hobbies': ['Cinema', 'Bike']}`
   * @default false
   */
  parseNested?: boolean | undefined
  /**
   * Preserves filename extension when using `safeFileNames` option.
   * If set to `true`, will default to an extension length of `3`.
   * If set to `number`, this will be the max allowable extension length.
   * If an extension is smaller than the extension length, it remains untouched. If the extension is longer,
   * it is shifted.
   * @default false
   *
   * @example
   * // true
   * app.use(fileUpload({ safeFileNames: true, preserveExtension: true }));
   * // myFileName.ext --> myFileName.ext
   *
   * @example
   * // max extension length 2, extension shifted
   * app.use(fileUpload({ safeFileNames: true, preserveExtension: 2 }));
   * // myFileName.ext --> myFileNamee.xt
   */
  preserveExtension?: boolean | number | undefined
  /**
   * Response which will be send to client if file size limit exceeded when `abortOnLimit` set to `true`.
   * @default 'File size limit has been reached'
   */
  responseOnLimit?: string | undefined
  /**
   * Strips characters from the upload's filename.
   * You can use custom regex to determine what to strip.
   * If set to `true`, non-alphanumeric characters _except_ dashes and underscores will be stripped.
   * This option is off by default.
   * @default false
   *
   * @example
   * // strip slashes from file names
   * app.use(fileUpload({ safeFileNames: /\\/g }))
   *
   * @example
   * app.use(fileUpload({ safeFileNames: true }))
   */
  safeFileNames?: boolean | RegExp | undefined
  /**
   * Path to store temporary files.
   * Used along with the `useTempFiles` option. By default this module uses `'tmp'` folder
   * in the current working directory.
   * You can use trailing slash, but it is not necessary.
   * @default 'tmp'
   */
  tempFileDir?: string | undefined
  /**
   * This defines how long to wait for data before aborting. Set to `0` if you want to turn off timeout checks.
   * @default 60_000
   */
  uploadTimeout?: number | undefined
  /**
   * Applies uri decoding to file names if set `true`.
   * @default false
   */
  uriDecodeFileNames?: boolean | undefined
  /**
   * By default this module uploads files into RAM.
   * Setting this option to `true` turns on using temporary files instead of utilising RAM.
   * This avoids memory overflow issues when uploading large files or in case of uploading
   * lots of files at same time.
   * @default false
   */
  useTempFiles?: boolean | undefined
} & Partial<BusboyConfig>

export type ErrorResult = {
  data?: any
  errors: {
    data?: Record<string, unknown>
    field?: string
    message?: string
    name?: string
  }[]
  stack?: string
}

export type AfterErrorResult = {
  graphqlResult?: GraphQLFormattedError
  response?: Partial<ErrorResult> & Record<string, unknown>
  status?: number
} | void

export type AfterErrorHookArgs = {
  /** The Collection that the hook is operating on. This will be undefined if the hook is executed from a non-collection endpoint or GraphQL. */
  collection?: SanitizedCollectionConfig
  /** 	Custom context passed between hooks */
  context: RequestContext
  /** The error that occurred. */
  error: Error
  /** The GraphQL result object, available if the hook is executed within a GraphQL context. */
  graphqlResult?: GraphQLFormattedError
  /** The Request object containing the currently authenticated user. */
  req: PayloadRequest
  /** The formatted error result object, available if the hook is executed from a REST context. */
  result?: ErrorResult
}

export type ImportMapGenerators = Array<
  (props: {
    addToImportMap: AddToImportMap
    baseDir: string
    config: SanitizedConfig
    importMap: InternalImportMap
    imports: Imports
  }) => void
>

export type AfterErrorHook = (
  args: AfterErrorHookArgs,
) => AfterErrorResult | Promise<AfterErrorResult>

export type WidgetWidth = 'full' | 'large' | 'medium' | 'small' | 'x-large' | 'x-small'

export type Widget = {
  ComponentPath: string
  /**
   * Human-friendly label for the widget.
   * Supports i18n by passing an object with locale keys, or a function with `t` for translations.
   * If not provided, the label will be auto-generated from the slug.
   */
  label?: LabelFunction | StaticLabel
  maxWidth?: WidgetWidth
  minWidth?: WidgetWidth
  slug: string
  // TODO: Add fields
  // fields?: Field[]
  // Maybe:
  // ImageURL?: string // similar to Block
}

/**
 * Client-side widget type with resolved label (no functions).
 */
export type ClientWidget = {
  label?: StaticLabel
  maxWidth?: WidgetWidth
  minWidth?: WidgetWidth
  slug: string
}

export type WidgetInstance = {
  // TODO: should be inferred from Widget Fields
  // data: Record<string, any>
  widgetSlug: string
  width?: WidgetWidth
}

export type DashboardConfig = {
  defaultLayout?:
    | ((args: { req: PayloadRequest }) => Array<WidgetInstance> | Promise<Array<WidgetInstance>>)
    | Array<WidgetInstance>
  widgets: Array<Widget>
}

export type SanitizedDashboardConfig = {
  widgets: Array<Omit<Widget, 'ComponentPath'>>
}

/**
 * This is the central configuration
 *
 * @see https://payloadcms.com/docs/configuration/overview
 */
export type Config = {
  /** Configure admin dashboard */
  admin?: {
    /** Automatically log in as a user */
    autoLogin?:
      | {
          /**
           * The email address of the user to login as
           */
          email?: string
          /** The password of the user to login as. This is only needed if `prefillOnly` is set to true */
          password?: string
          /**
           * If set to true, the login credentials will be prefilled but the user will still need to click the login button.
           *
           * @default false
           */
          prefillOnly?: boolean
          /** The username of the user to login as */
          username?: string
        }
      | false
    /**
     * Automatically refresh user tokens for users logged into the dashboard
     *
     * @default false
     */
    autoRefresh?: boolean
    /** Set account profile picture. Options: gravatar, default or a custom React component. */
    avatar?:
      | 'default'
      | 'gravatar'
      | {
          Component: PayloadComponent
        }

    /**
     * Add extra and/or replace built-in components with custom components
     *
     * @see https://payloadcms.com/docs/admin/custom-components/overview
     */
    components?: {
      /**
       * Add custom components to the top right of the Admin Panel
       */
      actions?: CustomComponent[]
      /**
       * Add custom components after the collection overview
       */
      afterDashboard?: CustomComponent[]
      /**
       * Add custom components after the email/password field
       */
      afterLogin?: CustomComponent[]
      /**
       * Add custom components after the navigation section
       */
      afterNav?: CustomComponent[]
      /**
       * Add custom components after the navigation links
       */
      afterNavLinks?: CustomComponent[]
      /**
       * Add custom components before the collection overview
       */
      beforeDashboard?: CustomComponent[]
      /**
       * Add custom components before the email/password field
       */
      beforeLogin?: CustomComponent[]
      /**
       * Add custom components before the navigation section
       */
      beforeNav?: CustomComponent[]
      /**
       * Add custom components before the navigation links
       */
      beforeNavLinks?: CustomComponent[]
      /** Replace graphical components */
      graphics?: {
        /** Replace the icon in the navigation */
        Icon?: CustomComponent
        /** Replace the logo on the login page */
        Logo?: CustomComponent
      }
      /**
       * Add custom header to top of page globally
       */
      header?: CustomComponent[]
      /** Replace logout related components */
      logout?: {
        /** Replace the logout button  */
        Button?: CustomComponent
      }
      /**
       * Replace the navigation with a custom component
       */
      Nav?: CustomComponent
      /**
       * Wrap the admin dashboard in custom context providers
       */
      providers?: PayloadComponent<{ children?: React.ReactNode }, { children?: React.ReactNode }>[]
      /**
       * Add custom menu items to the navigation menu accessible via the gear icon.
       * These components will be rendered in a popup menu above the logout button.
       */
      settingsMenu?: CustomComponent[]
      /**
       * Replace or modify top-level admin routes, or add new ones:
       * + `Account` - `/admin/account`
       * + `Dashboard` - `/admin`
       * + `:path` - `/admin/:path`
       */
      views?: {
        /** Add custom admin views */
        [key: string]: AdminViewConfig
        /** Replace the account screen */
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        account?: AdminViewConfig
        /** Replace the admin homepage */
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        dashboard?: AdminViewConfig
      }
    }
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    /**
     * Customize the dashboard widgets
     * @experimental This prop is subject to change in future releases.
     */
    dashboard?: DashboardConfig
    /** Global date format that will be used for all dates in the Admin panel. Any valid date-fns format pattern can be used. */
    dateFormat?: string
    /**
     * Each entry in this map generates an entry in the importMap.
     */
    dependencies?: AdminDependencies
    /**
     * @deprecated
     * This option is deprecated and will be removed in v4.
     * To disable the admin panel itself, delete your `/app/(payload)/admin` directory.
     * To disable all REST API and GraphQL endpoints, delete your `/app/(payload)/api` directory.
     * Note: If you've modified the default paths via `admin.routes`, delete those directories instead.
     */
    disable?: boolean
    importMap?: {
      /**
       * Automatically generate component map during development
       * @default true
       */
      autoGenerate?: boolean
      /**
       * The base directory for component paths starting with /.
       * @default process.cwd()
       **/
      baseDir?: string
      /**
       * You can use generators to add custom components to the component import map.
       * This allows you to import custom components in the admin panel.
       */
      generators?: ImportMapGenerators
      /**
       * If Payload cannot find the import map file location automatically,
       * you can manually provide it here.
       */
      importMapFile?: string
    }
    /**
     * Live Preview options.
     *
     * @see https://payloadcms.com/docs/live-preview/overview
     */
    livePreview?: RootLivePreviewConfig
    /** Base meta data to use for the Admin Panel. Included properties are titleSuffix, ogImage, and favicon. */
    meta?: MetaConfig
    routes?: {
      /** The route for the account page.
       *
       * @default '/account'
       */
      account?: `/${string}`
      /** The route for the browse by folder view.
       *
       * @default '/browse-by-folder'
       */
      browseByFolder?: `/${string}`
      /** The route for the create first user page.
       *
       * @default '/create-first-user'
       */
      createFirstUser?: `/${string}`
      /** The route for the forgot password page.
       *
       * @default '/forgot'
       */
      forgot?: `/${string}`
      /** The route the user will be redirected to after being inactive for too long.
       *
       * @default '/logout-inactivity'
       */
      inactivity?: `/${string}`
      /** The route for the login page.
       *
       * @default '/login'
       */
      login?: `/${string}`
      /** The route for the logout page.
       *
       * @default '/logout'
       */
      logout?: `/${string}`
      /** The route for the reset password page.
       *
       * @default '/reset'
       */
      reset?: `/${string}`
      /** The route for the unauthorized page.
       *
       * @default '/unauthorized'
       */
      unauthorized?: `/${string}`
    }
    /**
     * Suppresses React hydration mismatch warnings during the hydration of the root <html> tag.
     * Useful in scenarios where the server-rendered HTML might intentionally differ from the client-rendered DOM.
     * @default false
     */
    suppressHydrationWarning?: boolean
    /**
     * Restrict the Admin Panel theme to use only one of your choice
     *
     * @default 'all' // The theme can be configured by users
     */
    theme?: 'all' | 'dark' | 'light'
    /**
     * Configure timezone related settings for the admin panel.
     */
    timezones?: TimezonesConfig
    /**
     * Configure toast message behavior and appearance in the admin panel.
     * Currently using [Sonner](https://sonner.emilkowal.ski) for toast notifications.
     *
     * @experimental This property is experimental and may change in future releases. Use at your own risk.
     */
    toast?: {
      /**
       * Time in milliseconds until the toast automatically closes.
       * @default 4000
       */
      duration?: number
      /**
       * If `true`, will expand the message stack so that all messages are shown simultaneously without user interaction.
       * Otherwise only the latest notification can be read until the user hovers the stack.
       * @default false
       */
      expand?: boolean
      /**
       * The maximum number of toasts that can be visible on the screen at once.
       * @default 5
       */
      limit?: number
      /**
       * The position of the toast on the screen.
       * @default 'bottom-right'
       */
      position?:
        | 'bottom-center'
        | 'bottom-left'
        | 'bottom-right'
        | 'top-center'
        | 'top-left'
        | 'top-right'
    }
    /** The slug of a Collection that you want to be used to log in to the Admin dashboard. */
    user?: string
  }

  /**
   * Configure authentication-related Payload-wide settings.
   */
  auth?: {
    /**
     * Define which JWT identification methods you'd like to support for Payload's local auth strategy, as well as the order that they're retrieved in.
     * Defaults to ['JWT', 'Bearer', 'cookie]
     */
    jwtOrder: ('Bearer' | 'cookie' | 'JWT')[]
  }
  /** Custom Payload bin scripts can be injected via the config. */
  bin?: BinScriptConfig[]
  blocks?: Block[]
  /**
   * Pass additional options to the parser used to process `multipart/form-data` requests.
   * For example, a PATCH request containing HTML form data.
   * For example, you may want to increase the `limits` imposed by the parser.
   * Currently using @link {https://www.npmjs.com/package/busboy|busboy} under the hood.
   *
   * @experimental This property is experimental and may change in future releases. Use at your own risk.
   */
  bodyParser?: Partial<BusboyConfig>
  /**
   * Manage the datamodel of your application
   *
   * @see https://payloadcms.com/docs/configuration/collections#collection-configs
   */
  collections?: CollectionConfig[]
  /**
   * Compatibility flags for prior Payload versions
   */
  compatibility?: {
    /**
     * By default, Payload will remove the `localized: true` property
     * from fields if a parent field is localized. Set this property
     * to `true` only if you have an existing Payload database from pre-3.0
     * that you would like to maintain without migrating. This is only
     * relevant for MongoDB databases.
     *
     * @todo Remove in v4
     */
    allowLocalizedWithinLocalized: true
  }
  /**
   * Prefix a string to all cookies that Payload sets.
   *
   * @default "payload"
   */
  cookiePrefix?: string
  /** Either a whitelist array of URLS to allow CORS requests from, or a wildcard string ('*') to accept incoming requests from any domain. */
  cors?: '*' | CORSConfig | string[]
  /** A whitelist array of URLs to allow Payload cookies to be accepted from as a form of CSRF protection. */
  csrf?: string[]
  /** Extension point to add your custom data. Server only. */
  custom?: Record<string, any>
  /** Pass in a database adapter for use on this project. */
  db: DatabaseAdapterResult
  /** Enable to expose more detailed error information. */
  debug?: boolean
  /**
   * If a user does not specify `depth` while requesting a resource, this depth will be used.
   *
   * @see https://payloadcms.com/docs/getting-started/concepts#depth
   *
   * @default 2
   */
  defaultDepth?: number
  /**
   * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
   *
   * @default 40000
   */
  defaultMaxTextLength?: number
  /** Default richtext editor to use for richText fields */
  editor?: RichTextAdapterProvider<any, any, any>
  /**
   * Email Adapter
   *
   * @see https://payloadcms.com/docs/email/overview
   */
  email?: EmailAdapter | Promise<EmailAdapter>
  /** Custom REST endpoints */
  endpoints?: Endpoint[]
  /**
   * Experimental features may be unstable or change in future versions.
   */
  experimental?: {
    /**
     * Enable per-locale status for documents.
     *
     * Requires:
     * - `localization` enabled
     * - `versions.drafts` enabled
     * - `versions.drafts.localizeStatus` set at collection or global level
     *
     * @experimental
     */
    localizeStatus?: boolean
  }
  /**
   * Options for folder view within the admin panel
   *
   * @experimental This feature may change in minor versions until it is fully stable
   */
  folders?: false | RootFoldersConfiguration
  /**
   * @see https://payloadcms.com/docs/configuration/globals#global-configs
   */
  globals?: GlobalConfig[]
  /**
   * Manage the GraphQL API
   *
   * You can add your own GraphQL queries and mutations to Payload, making use of all the types that Payload has defined for you.
   *
   * @see https://payloadcms.com/docs/graphql/overview
   */
  graphQL?: {
    disable?: boolean
    /**
     * Disable introspection queries in production.
     *
     * @default true
     */
    disableIntrospectionInProduction?: boolean
    /**
     * Disable the GraphQL Playground in production.
     *
     * @default true
     */
    disablePlaygroundInProduction?: boolean
    maxComplexity?: number
    /**
     * Function that returns an object containing keys to custom GraphQL mutations
     *
     * @see https://payloadcms.com/docs/graphql/extending
     */
    mutations?: GraphQLExtension
    /**
     * Function that returns an object containing keys to custom GraphQL queries
     *
     * @see https://payloadcms.com/docs/graphql/extending
     */
    queries?: GraphQLExtension
    /**
     * Filepath to write the generated schema to
     */
    schemaOutputFile?: string
    /**
     * Function that returns an array of validation rules to apply to the GraphQL schema
     *
     * @see https://payloadcms.com/docs/graphql/overview#custom-validation-rules
     */
    validationRules?: (args: GraphQL.ExecutionArgs) => GraphQL.ValidationRule[]
  }
  /**
   * Tap into Payload-wide hooks.
   *
   * @see https://payloadcms.com/docs/hooks/overview
   */
  hooks?: {
    afterError?: AfterErrorHook[]
  }
  /** i18n config settings */
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  i18n?: I18nOptions<{} | DefaultTranslationsObject> // loosen the type here to allow for custom translations
  /** Automatically index all sortable top-level fields in the database to improve sort performance and add database compatibility for Azure Cosmos and similar. */
  indexSortableFields?: boolean
  /**
   * @experimental There may be frequent breaking changes to this API
   */
  jobs?: JobsConfig
  /**
   * Pass in a KV adapter for use on this project.
   * @default `DatabaseKVAdapter` from:
   * ```ts
   * import { createDatabaseKVAdapter } from 'payload'
   * createDatabaseKVAdapter()
   * ```
   */
  kv?: KVAdapterResult
  /**
   * Translate your content to different languages/locales.
   *
   * @default false // disable localization
   */
  localization?: false | LocalizationConfig
  /**
   * Logger options, logger options with a destination stream, or an instantiated logger instance.
   *
   * See Pino Docs for options: https://getpino.io/#/docs/api?id=options
   *
   * ```ts
   * // Logger options only
   * logger: {
   *   level: 'info',
   * }
   *
   * // Logger options with destination stream
   * logger: {
   *  options: {
   *   level: 'info',
   *  },
   *  destination: process.stdout
   * },
   *
   * // Logger instance
   * logger: pino({ name: 'my-logger' })
   *
   * ```
   */
  logger?: 'sync' | { destination?: DestinationStream; options: LoggerOptions } | PayloadLogger

  /**
   * Override the log level of errors for Payload's error handler or disable logging with `false`.
   * Levels can be any of the following: 'trace', 'debug', 'info', 'warn', 'error', 'fatal' or false.
   *
   * Default levels:
   * {
  `*   APIError: 'error',
  `*   AuthenticationError: 'error',
  `*   ErrorDeletingFile: 'error',
  `*   FileRetrievalError: 'error',
  `*   FileUploadError: 'error',
  `*   Forbidden: 'info',
  `*   Locked: 'info',
  `*   LockedAuth: 'error',
  `*   MissingFile: 'info',
  `*   NotFound: 'info',
  `*   QueryError: 'error',
  `*   ValidationError: 'info',
   * }
   */
  loggingLevels?: Partial<Record<ErrorName, false | Level>>

  /**
   * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
   *
   * @see https://payloadcms.com/docs/getting-started/concepts#depth
   *
   * @default 10
   */
  maxDepth?: number

  /** A function that is called immediately following startup that receives the Payload instance as its only argument. */
  onInit?: (payload: Payload) => Promise<void> | void
  /**
   * An array of Payload plugins.
   *
   * @see https://payloadcms.com/docs/plugins/overview
   */
  plugins?: Plugin[]
  /**
   * Allow you to save and share filters, columns, and sort orders for your collections.
   * @see https://payloadcms.com/docs/query-presets/overview
   */
  queryPresets?: {
    /**
     * Define collection-level access control that applies to all presets globally.
     * This is separate from document-level access (constraints) which users can configure per-preset.
     */
    access: {
      create?: Access<QueryPreset>
      delete?: Access<QueryPreset>
      read?: Access<QueryPreset>
      update?: Access<QueryPreset>
    }
    /**
     * Define custom document-level access control options for presets.
     *
     * Payload provides sensible defaults (Only Me, Everyone, Specific Users), but you can
     * add custom constraints for more complex patterns like RBAC.
     *
     * @example
     * ```ts
     * constraints: {
     *   read: [
     *     {
     *       label: 'Specific Roles',
     *       value: 'specificRoles',
     *       fields: [
     *         {
     *           name: 'roles',
     *           type: 'select',
     *           hasMany: true,
     *           options: [
     *             { label: 'Admin', value: 'admin' },
     *             { label: 'User', value: 'user' },
     *           ],
     *         },
     *       ],
     *       access: ({ req: { user } }) => ({
     *         'access.read.roles': { in: [user?.roles] },
     *       }),
     *     },
     *   ],
     * }
     * ```
     *
     * @see https://payloadcms.com/docs/query-presets/overview#custom-access-control
     */
    constraints: {
      create?: QueryPresetConstraints
      delete?: QueryPresetConstraints
      read?: QueryPresetConstraints
      update?: QueryPresetConstraints
    }
    /**
     * Used to dynamically filter which constraints are available based on the current user, document data,
     * or other criteria.
     *
     * Some examples of this might include:
     *
     * - Ensuring that only "admins" are allowed to make a preset available to "everyone"
     * - Preventing the "onlyMe" option from being selected based on a hypothetical "disablePrivatePresets" checkbox
     *
     * When a user lacks the permission to set a constraint, the option will either be hidden from them, or disabled if it is already saved to that preset.
     *
     * @see https://payloadcms.com/docs/query-presets/overview#constraint-access-control
     */
    filterConstraints?: SelectField['filterOptions']
    labels?: CollectionConfig['labels']
  }
  /**
   * Control the routing structure that Payload binds itself to.
   * @link https://payloadcms.com/docs/admin/overview#root-level-routes
   */
  routes?: {
    /**
     * The route for the admin panel.
     * @example "/my-admin" or "/"
     * @default "/admin"
     * @link https://payloadcms.com/docs/admin/overview#root-level-routes
     */
    admin?: string
    /**
     * The base route for all REST API endpoints.
     * @default "/api"
     * @link https://payloadcms.com/docs/admin/overview#root-level-routes
     */
    api?: string
    /**
     * The base route for all GraphQL endpoints.
     * @default "/graphql"
     * @link https://payloadcms.com/docs/admin/overview#root-level-routes
     */
    graphQL?: string
    /**
     * The route for the GraphQL Playground.
     * @default "/graphql-playground"
     * @link https://payloadcms.com/docs/admin/overview#root-level-routes
     */
    graphQLPlayground?: string
  }
  /** Secure string that Payload will use for any encryption workflows */
  secret: string
  /**
   * Define the absolute URL of your app including the protocol, for example `https://example.org`.
   * No paths allowed, only protocol, domain and (optionally) port.
   *
   * @see https://payloadcms.com/docs/configuration/overview#options
   */
  serverURL?: string
  /**
   * Pass in a local copy of Sharp if you'd like to use it.
   *
   */
  sharp?: SharpDependency
  /** Send anonymous telemetry data about general usage. */
  telemetry?: boolean
  /** Control how typescript interfaces are generated from your collections. */
  typescript?: {
    /**
     * Automatically generate types during development
     * @default true
     */
    autoGenerate?: boolean

    /** Disable declare block in generated types file */
    declare?:
      | {
          /**
           * @internal internal use only to allow for multiple declarations within a monorepo and suppress the "Duplicate identifier GeneratedTypes" error
           *
           * Adds a @ts-ignore flag above the GeneratedTypes interface declaration
           *
           * @default false
           */
          ignoreTSError?: boolean
        }
      | false

    /** Filename to write the generated types to */
    outputFile?: string

    /**
     * Allows you to modify the base JSON schema that is generated during generate:types. This JSON schema will be used
     * to generate the TypeScript interfaces.
     */
    schema?: Array<
      (args: {
        collectionIDFieldTypes: {
          [key: string]: 'number' | 'string'
        }
        config: SanitizedConfig
        i18n: I18n
        jsonSchema: JSONSchema4
      }) => JSONSchema4
    >

    /**
     * Enable strict type safety for draft operations. When enabled, the `draft` parameter is forbidden
     * on collections without drafts, and query results with `draft: true` type required fields as optional.
     * This prevents invalid draft usage at compile time and ensures type correctness across all Local API operations.
     *
     * @default false
     * @todo Remove in v4. Strict draft types will become the default behavior.
     */
    strictDraftTypes?: boolean
  }
  /**
   * Customize the handling of incoming file uploads for collections that have uploads enabled.
   */
  upload?: FetchAPIFileUploadOptions
}

/**
 * @todo remove the `DeepRequired` in v4.
 * We don't actually guarantee that all properties are set when sanitizing configs.
 */
export type SanitizedConfig = {
  admin: {
    timezones: SanitizedTimezoneConfig
  } & DeepRequired<Config['admin']>
  blocks?: FlattenedBlock[]
  collections: SanitizedCollectionConfig[]
  /** Default richtext editor to use for richText fields */
  editor?: RichTextAdapter<any, any, any>
  endpoints: Endpoint[]
  globals: SanitizedGlobalConfig[]
  i18n: Required<I18nOptions>
  jobs: SanitizedJobsConfig
  localization: false | SanitizedLocalizationConfig
  paths: {
    config: string
    configDir: string
    rawConfig: string
  }
  upload: {
    /**
     * Deduped list of adapters used in the project
     */
    adapters: string[]
  } & FetchAPIFileUploadOptions
} & Omit<
  // TODO: DeepRequired breaks certain, advanced TypeScript types / certain type information is lost. We should remove it when possible.
  // E.g. in packages/ui/src/graphics/Account/index.tsx in getComponent, if avatar.Component is casted to what it's supposed to be,
  // the result type is different
  DeepRequired<Config>,
  | 'admin'
  | 'blocks'
  | 'collections'
  | 'editor'
  | 'endpoint'
  | 'globals'
  | 'i18n'
  | 'jobs'
  | 'localization'
  | 'upload'
>

export type EditConfig = EditConfigWithoutRoot | EditConfigWithRoot

/**
 * Replace or modify _all_ nested document views and routes, including the document header, controls, and tabs. This cannot be used in conjunction with other nested views.
 * + `root` - `/admin/collections/:collection/:id/**\/*`
 * @link https://payloadcms.com/docs/custom-components/document-views#document-root
 */
export type EditConfigWithRoot = {
  api?: never
  default?: never
  livePreview?: never
  root: DefaultDocumentViewConfig
  version?: never
  versions?: never
}

type KnownEditKeys = 'api' | 'default' | 'livePreview' | 'root' | 'version' | 'versions'

/**
 * Replace or modify individual nested routes, or add new ones:
 * + `default` - `/admin/collections/:collection/:id`
 * + `api` - `/admin/collections/:collection/:id/api`
 * + `livePreview` - `/admin/collections/:collection/:id/preview`
 * + `references` - `/admin/collections/:collection/:id/references`
 * + `relationships` - `/admin/collections/:collection/:id/relationships`
 * + `versions` - `/admin/collections/:collection/:id/versions`
 * + `version` - `/admin/collections/:collection/:id/versions/:version`
 * + `customView` - `/admin/collections/:collection/:id/:path`
 *
 * To override the entire Edit View including all nested views, use the `root` key.
 *
 * @link https://payloadcms.com/docs/custom-components/document-views
 */
export type EditConfigWithoutRoot = {
  [K in Exclude<string, KnownEditKeys>]: CustomDocumentViewConfig
} & {
  api?: DefaultDocumentViewConfig
  default?: DefaultDocumentViewConfig
  livePreview?: DefaultDocumentViewConfig
  root?: never
  version?: DefaultDocumentViewConfig
  versions?: DefaultDocumentViewConfig
}

export type EntityDescriptionComponent = CustomComponent

export type EntityDescriptionFunction = ({ t }: { t: TFunction }) => string

export type EntityDescription = EntityDescriptionFunction | Record<string, string> | string

export type { EmailAdapter, SendEmailOptions }
