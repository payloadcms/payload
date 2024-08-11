import type {
  DefaultTranslationsObject,
  I18nClient,
  I18nOptions,
  TFunction,
} from '@payloadcms/translations'
import type { Options as ExpressFileUploadOptions } from 'express-fileupload'
import type GraphQL from 'graphql'
import type { JSONSchema4 } from 'json-schema'
import type { DestinationStream, LoggerOptions } from 'pino'
import type React from 'react'
import type { default as sharp } from 'sharp'
import type { DeepRequired } from 'ts-essentials'

import type { RichTextAdapterProvider } from '../admin/RichText.js'
import type { DocumentTabConfig, MappedComponent, RichTextAdapter } from '../admin/types.js'
import type { AdminViewConfig, ServerSideEditViewProps } from '../admin/views/types.js'
import type { Permissions } from '../auth/index.js'
import type {
  AddToImportMap,
  ImportMap,
  Imports,
  InternalImportMap,
} from '../bin/generateImportMap/index.js'
import type {
  AfterErrorHook,
  Collection,
  CollectionConfig,
  SanitizedCollectionConfig,
} from '../collections/config/types.js'
import type { DatabaseAdapterResult } from '../database/types.js'
import type { EmailAdapter, SendEmailOptions } from '../email/types.js'
import type { GlobalConfig, Globals, SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, TypedUser } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type { PayloadLogger } from '../utilities/logger.js'

/**
 * The string path pointing to the React component. If one of the generics is `never`, you effectively mark it as a server-only or client-only component.
 *
 * If the path is an empty string, it will be treated as () => null
 */
export type PayloadComponent<
  TComponentServerProps extends never | object = Record<string, any>,
  TComponentClientProps extends never | object = Record<string, any>,
> = RawPayloadComponent<TComponentServerProps, TComponentClientProps> | string

// We need the actual object as its own type, otherwise the infers for the PayloadClientReactComponent / PayloadServerReactComponent will not work due to the string union.
// We also NEED to actually use those generics for this to work, thus they are part of the props.
export type RawPayloadComponent<
  TComponentServerProps extends never | object = Record<string, any>,
  TComponentClientProps extends never | object = Record<string, any>,
> = {
  clientProps?: TComponentClientProps | object
  exportName?: string
  path: string
  serverProps?: TComponentServerProps | object
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
  Component: React.FC<TComponentClientProps | TComponentServerProps>
  clientProps?: TComponentClientProps
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
   The URL of the frontend application. This will be rendered within an `iframe` as its `src`.
   Payload will send a `window.postMessage()` to this URL with the document data in real-time.
   The frontend application is responsible for receiving the message and updating the UI accordingly.
   Use the `useLivePreview` hook to get started in React applications.
   */
  url?:
    | ((args: {
        collectionConfig?: SanitizedCollectionConfig
        data: Record<string, any>
        globalConfig?: SanitizedGlobalConfig
        locale: Locale
        payload: Payload
      }) => Promise<string> | string)
    | string
}

export type OGImageConfig = {
  alt?: string
  height?: number | string
  type?: string
  url: string
  width?: number | string
}

export type OpenGraphConfig = {
  description?: string
  images?: OGImageConfig | OGImageConfig[]
  siteName?: string
  title?: string
}

export type IconConfig = {
  color?: string
  /**
   * @see https://developer.mozilla.org/docs/Web/API/HTMLImageElement/fetchPriority
   */
  fetchPriority?: 'auto' | 'high' | 'low'
  media?: string
  /** defaults to rel="icon" */
  rel?: string
  sizes?: string
  type?: string
  /**
   * URL of the icon to use. You can use a relative path from the public folder (see https://nextjs.org/docs/app/building-your-application/optimizing/static-assets) or an absolute URL.
   */
  url: string
}

export type MetaConfig = {
  /**
   * When `static`, a pre-made image will be used for all pages.
   * When `dynamic`, a unique image will be generated for each page based on page content and given overrides.
   * When `off`, no Open Graph images will be generated and the `/api/og` endpoint will be disabled. You can still provide custom images using the `openGraph.images` property.
   * @default 'dynamic'
   */
  defaultOGImageType?: 'dynamic' | 'off' | 'static'
  /**
   * Overrides the auto-generated <meta name="description"> of admin pages
   * @example `"This is my custom CMS built with Payload."`
   */
  description?: string
  /**
   * Icons to be rendered by devices and browsers.
   *
   * For example browser tabs, phone home screens, and search engine results.
   */
  icons?: IconConfig[]
  /**
   * Overrides the auto-generated <meta name="keywords"> of admin pages
   * @example `"CMS, Payload, Custom"`
   */
  keywords?: string
  /**
   * Metadata to be rendered as `og` meta tags in the head of the Admin Panel.
   *
   * For example when sharing the Admin Panel on social media or through messaging services.
   */
  openGraph?: OpenGraphConfig
  /**
   * Overrides the auto-generated <title> of admin pages
   * @example `"My Admin Panel"`
   */
  title?: string
  /**
   * String to append to the auto-generated <title> of admin pages
   * @example `" - Custom CMS"`
   */
  titleSuffix?: string
}

export type ServerOnlyLivePreviewProperties = keyof Pick<LivePreviewConfig, 'url'>

type GeneratePreviewURLOptions = {
  locale: string
  req: PayloadRequest
  token: null | string
}

export type GeneratePreviewURL = (
  doc: Record<string, unknown>,
  options: GeneratePreviewURLOptions,
) => Promise<null | string> | null | string

export type GraphQLInfo = {
  Mutation: {
    fields: Record<string, any>
    name: string
  }
  Query: {
    fields: Record<string, any>
    name: string
  }
  collections: {
    [slug: string]: Collection
  }
  globals: Globals
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
   * Disable connect to the database on init
   */
  disableDBConnect?: boolean

  /**
   * Disable running of the `onInit` function
   */
  disableOnInit?: boolean

  importMap?: ImportMap

  /**
   * A previously instantiated logger instance. Must conform to the PayloadLogger interface which uses Pino
   * This allows you to bring your own logger instance and let payload use it
   */
  logger?: PayloadLogger

  loggerDestination?: DestinationStream
  /**
   * Specify options for the built-in Pino logger that Payload uses for internal logging.
   *
   * See Pino Docs for options: https://getpino.io/#/docs/api?id=options
   */
  loggerOptions?: LoggerOptions
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
export type AccessResult = Where | boolean

export type AccessArgs<TData = any> = {
  /**
   * The relevant resource that is being accessed.
   *
   * `data` is null when a list is requested
   */
  data?: TData
  /** ID of the resource being accessed */
  id?: number | string
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
  /** HTTP method (or "all") */
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

export type EditViewComponent = PayloadComponent<ServerSideEditViewProps>

export type EditViewConfig =
  | {
      /**
       * Add a new Edit view to the admin panel
       * i.e. you can render a custom view that has no tab, if desired
       * Or override a specific properties of an existing one
       * i.e. you can customize the `Default` view tab label, if desired
       */
      Tab?: DocumentTabConfig
      path?: string
    }
  | {
      Component: EditViewComponent
      path?: string
    }
  | {
      actions?: CustomComponent[]
    }

export type ServerProps = {
  [key: string]: unknown
  i18n: I18nClient
  locale?: Locale
  params?: { [key: string]: string | string[] | undefined }
  payload: Payload
  permissions?: Permissions
  searchParams?: { [key: string]: string | string[] | undefined }
  user?: TypedUser
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
  fallbackLocale?: string
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
  /** Set to `true` to let missing values in localised fields fall back to the values in `defaultLocale` */
  fallback?: boolean
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

export type LabelFunction = ({ t }: { t: TFunction }) => string

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
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array
    | string,
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

    /** Set account profile picture. Options: gravatar, default or a custom React component. */
    avatar?:
      | 'default'
      | 'gravatar'
      | {
          Component: PayloadComponent<never>
        }
    /**
     * Add extra and/or replace built-in components with custom components
     *
     * @see https://payloadcms.com/docs/admin/components
     */
    components?: {
      /**
       * Replace the navigation with a custom component
       */
      Nav?: CustomComponent
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
      /** Replace logout related components */
      logout?: {
        /** Replace the logout button  */
        Button?: CustomComponent
      }
      /**
       * Wrap the admin dashboard in custom context providers
       */
      providers?: PayloadComponent<{ children?: React.ReactNode }, { children?: React.ReactNode }>[]
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
        Account?: AdminViewConfig
        /** Replace the admin homepage */
        Dashboard?: AdminViewConfig
      }
    }
    /** Extension point to add your custom data. Available in server and client. */
    custom?: Record<string, any>
    /** Global date format that will be used for all dates in the Admin panel. Any valid date-fns format pattern can be used. */
    dateFormat?: string
    /**
     * Each entry in this map generates an entry in the importMap,
     * as well as an entry in the componentMap if the type of the
     * dependency is 'component'
     */
    dependencies?: AdminDependencies
    /** If set to true, the entire Admin panel will be disabled. */
    disable?: boolean
    importMap?: {
      /**
       * Automatically generate component map during development
       * @default true
       */
      autoGenerate?: boolean

      /** The base directory for component paths starting with /.
       *
       * By default, this is process.cwd()
       **/
      baseDir?: string
      /**
       * You can use generators to add custom components to the component import map.
       * This allows you to import custom components in the admin panel.
       */
      generators?: Array<
        (props: {
          addToImportMap: AddToImportMap
          baseDir: string
          config: SanitizedConfig
          importMap: InternalImportMap
          imports: Imports
        }) => void
      >
    }
    livePreview?: {
      collections?: string[]
      globals?: string[]
    } & LivePreviewConfig
    /** Base meta data to use for the Admin Panel. Included properties are titleSuffix, ogImage, and favicon. */
    meta?: MetaConfig
    routes?: {
      /** The route for the account page. */
      account?: string
      /** The route for the create first user page. */
      createFirstUser?: string
      /** The route for the forgot password page. */
      forgot?: string
      /** The route the user will be redirected to after being inactive for too long. */
      inactivity?: string
      /** The route for the login page. */
      login?: string
      /** The route for the logout page. */
      logout?: string
      /** The route for the reset password page. */
      reset?: string
      /** The route for the unauthorized page. */
      unauthorized?: string
    }
    /** The slug of a Collection that you want to be used to log in to the Admin dashboard. */
    user?: string
  }
  /** Custom Payload bin scripts can be injected via the config. */
  bin?: BinScriptConfig[]
  /**
   * Manage the datamodel of your application
   *
   * @see https://payloadcms.com/docs/configuration/collections#collection-configs
   */
  collections?: CollectionConfig[]
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
  }
  /**
   * Tap into Payload-wide hooks.
   *
   * @see https://payloadcms.com/docs/hooks/overview
   */
  hooks?: {
    afterError?: AfterErrorHook
  }
  /** i18n config settings */
  i18n?: I18nOptions<{} | DefaultTranslationsObject> // loosen the type here to allow for custom translations
  /** Automatically index all sortable top-level fields in the database to improve sort performance and add database compatibility for Azure Cosmos and similar. */
  indexSortableFields?: boolean
  /**
   * Translate your content to different languages/locales.
   *
   * @default false // disable localization
   */
  localization?: LocalizationConfig | false
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
  /** Control the routing structure that Payload binds itself to. */
  routes?: {
    /** The route for the admin panel.
     * @example "/my-admin"
     * @default "/admin"
     */
    admin?: string
    /** @default "/api"  */
    api?: string
    /** @default "/graphql"  */
    graphQL?: string
    /** @default "/graphql-playground" */
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
    schema?: Array<(args: { jsonSchema: JSONSchema4 }) => JSONSchema4>
  }
  /**
   * Customize the handling of incoming file uploads for collections that have uploads enabled.
   */
  upload?: ExpressFileUploadOptions
}

export type SanitizedConfig = {
  collections: SanitizedCollectionConfig[]
  /** Default richtext editor to use for richText fields */
  editor?: RichTextAdapter<any, any, any>
  endpoints: Endpoint[]
  globals: SanitizedGlobalConfig[]
  i18n: Required<I18nOptions>
  localization: SanitizedLocalizationConfig | false
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
  } & ExpressFileUploadOptions
} & Omit<
  // TODO: DeepRequired breaks certain, advanced TypeScript types / certain type information is lost. We should remove it when possible.
  // E.g. in packages/ui/src/graphics/Account/index.tsx in getComponent, if avatar.Component is casted to what it's supposed to be,
  // the result type is different
  DeepRequired<Config>,
  'collections' | 'editor' | 'endpoint' | 'globals' | 'i18n' | 'localization' | 'upload'
>

export type EditConfig = {
  [key: string]: Partial<EditViewConfig>
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
  API?: Partial<EditViewConfig>
  Default?: Partial<EditViewConfig>
  LivePreview?: Partial<EditViewConfig>
  Version?: Partial<EditViewConfig>
  Versions?: Partial<EditViewConfig>

  // TODO: uncomment these as they are built
  // References?: EditView
  // Relationships?: EditView
}

export type EntityDescriptionComponent = CustomComponent

export type EntityDescriptionFunction = ({ t }: { t: TFunction }) => string

export type EntityDescription = EntityDescriptionFunction | Record<string, string> | string

export type { EmailAdapter, SendEmailOptions }
