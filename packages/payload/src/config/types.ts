import type { I18nOptions } from '@payloadcms/translations'
import type { Express } from 'express'
import type { Options as ExpressFileUploadOptions } from 'express-fileupload'
import type GraphQL from 'graphql'
import type { Transporter } from 'nodemailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type { DestinationStream, LoggerOptions } from 'pino'
import type React from 'react'
import type { DeepRequired } from 'ts-essentials'
// @ts-ignore-next-line

import type { Payload } from '..'
import type { DocumentTab, RichTextAdapter } from '../admin/types'
import type { User } from '../auth/types'
import type { PayloadBundler } from '../bundlers/types'
import type {
  AfterErrorHook,
  Collection,
  CollectionConfig,
  SanitizedCollectionConfig,
} from '../collections/config/types'
import type { DatabaseAdapterResult } from '../database/types'
import type { ClientConfigField } from '../fields/config/types'
import type { GlobalConfig, Globals, SanitizedGlobalConfig } from '../globals/config/types'
import type { PayloadRequest } from '../types'
import type { Where } from '../types'

export type BinScriptConfig = {
  key: string
  scriptPath: string
}

export type BinScript = (config: SanitizedConfig) => Promise<void> | void

type Prettify<T> = {
  [K in keyof T]: T[K]
} & NonNullable<unknown>

type Email = {
  fromAddress: string
  fromName: string
  logMockCredentials?: boolean
}

// eslint-disable-next-line no-use-before-define
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
        data: Record<string, any>
        documentInfo: any // TODO: remove or populate this
        locale: Locale
      }) => Promise<string> | string)
    | string
}

type GeneratePreviewURLOptions = {
  locale: string
  token: string
}

export type GeneratePreviewURL = (
  doc: Record<string, unknown>,
  options: GeneratePreviewURLOptions,
) => Promise<null | string> | null | string

export type EmailTransport = Email & {
  transport: Transporter
  transportOptions?: SMTPConnection.Options
}

export type EmailTransportOptions = Email & {
  transport?: Transporter
  transportOptions: SMTPConnection.Options
}

export type EmailOptions = Email | EmailTransport | EmailTransportOptions

/**
 * type guard for EmailOptions
 * @param emailConfig
 */
export function hasTransport(emailConfig: EmailOptions): emailConfig is EmailTransport {
  return (emailConfig as EmailTransport).transport !== undefined
}

/**
 * type guard for EmailOptions
 * @param emailConfig
 */
export function hasTransportOptions(
  emailConfig: EmailOptions,
): emailConfig is EmailTransportOptions {
  return (emailConfig as EmailTransportOptions).transportOptions !== undefined
}

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
    [slug: number | string | symbol]: Collection
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

  /**
   * Configuration for Payload's email functionality
   *
   * @see https://payloadcms.com/docs/email/overview
   */
  email?: EmailOptions

  /** Express app for Payload to use */
  express?: Express

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

export type AccessArgs<T = any, U = any> = {
  /**
   * The relevant resource that is being accessed.
   *
   * `data` is null when a list is requested
   */
  data?: T
  /** ID of the resource being accessed */
  id?: number | string
  /** If true, the request is for a static file */
  isReadingStaticFile?: boolean
  /** The original request that requires an access check */
  req: PayloadRequest<U>
}

/**
 * Access function runs on the server
 * and is sent to the client allowing the dashboard to show accessible data and actions.
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type Access<T = any, U = any> = (
  args: AccessArgs<T, U>,
) => AccessResult | Promise<AccessResult>

/** Equivalent to express middleware, but with an enhanced request object */
export type PayloadHandler = (req: PayloadRequest) => Promise<Response> | Response

/**
 * Docs: https://payloadcms.com/docs/rest-api/overview#custom-endpoints
 */
export type Endpoint<U = User> = {
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
   * @deprecated in 3.0
   *
   * Please add "root" routes under the /api folder in the Payload Project.
   * https://nextjs.org/docs/app/api-reference/file-conventions/route
   */
  root?: never
}

export type AdminViewConfig = {
  Component: AdminViewComponent
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean
  path: string
  sensitive?: boolean
  strict?: boolean
}

export type AdminViewProps = {
  canAccessAdmin?: boolean
  user: User | null | undefined
}

export type AdminViewComponent = React.ComponentType<AdminViewProps>

export type AdminView = AdminViewComponent | AdminViewConfig

export type EditViewProps = {
  collectionSlug?: string
  globalSlug?: string
}

export type EditViewComponent = React.ComponentType<EditViewProps>

export type EditViewConfig =
  | {
      /**
       * Add a new Edit view to the admin panel
       * i.e. you can render a custom view that has no tab, if desired
       * Or override a specific properties of an existing one
       * i.e. you can customize the `Default` view tab label, if desired
       */
      Tab?: DocumentTab
      path?: string
    }
  | {
      Component: AdminViewComponent // TODO: The `Edit` view Component is of type `React.FC<EditViewProps>`
      path: string
    }
  | {
      actions?: React.ComponentType<any>[]
    }

/**
 * Override existing views
 * i.e. Dashboard, Account, API, LivePreview, etc.
 * Path is not available here
 * All Tab properties become optional
 * i.e. you can change just the label, if desired
 */
export type EditView = AdminViewComponent | EditViewConfig

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
  BaseLocalizationConfig & {
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    locales: string[]
  }
>

export type LocalizationConfigWithLabels = Prettify<
  BaseLocalizationConfig & {
    /**
     * List of supported locales with labels
     * @example {
     *  label: 'English',
     *  value: 'en',
     *  rtl: false
     * }
     */
    locales: Locale[]
  }
>

export type SanitizedLocalizationConfig = Prettify<
  LocalizationConfigWithLabels & {
    /**
     * List of supported locales
     * @example `["en", "es", "fr", "nl", "de", "jp"]`
     */
    localeCodes: string[]
  }
>

/**
 * @see https://payloadcms.com/docs/configuration/localization#localization
 */
export type LocalizationConfig = Prettify<
  LocalizationConfigWithLabels | LocalizationConfigWithNoLabels
>

/**
 * This is the central configuration
 *
 * @see https://payloadcms.com/docs/configuration/overview
 */
export type Config = {
  /** Configure admin dashboard */
  admin?: {
    /** Automatically log in as a user when visiting the admin dashboard. */
    autoLogin?:
      | {
          /**
           * The email address of the user to login as
           *
           */
          email: string
          /** The password of the user to login as */
          password: string
          /**
           * If set to true, the login credentials will be prefilled but the user will still need to click the login button.
           *
           * @default false
           */
          prefillOnly?: boolean
        }
      | false

    /** Set account profile picture. Options: gravatar, default or a custom React component. */
    avatar?: 'default' | 'gravatar' | React.ComponentType<any>
    /**
     * Specify an absolute path for where to store the built Admin panel bundle used in production.
     *
     * @default "/build"
     * */
    buildPath?: string
    /** Customize the bundler used to run your admin panel. */
    bundler?: PayloadBundler
    /**
     * Add extra and/or replace built-in components with custom components
     *
     * @see https://payloadcms.com/docs/admin/components
     */
    components?: {
      /**
       * Replace the navigation with a custom component
       */
      Nav?: React.ComponentType<any>
      /**
       * Add custom components to the top right of the Admin Panel
       */
      actions?: React.ComponentType<any>[]
      /**
       * Add custom components after the collection overview
       */
      afterDashboard?: React.ComponentType<any>[]
      /**
       * Add custom components after the email/password field
       */
      afterLogin?: React.ComponentType<any>[]
      /**
       * Add custom components after the navigation links
       */
      afterNavLinks?: React.ComponentType<any>[]
      /**
       * Add custom components before the collection overview
       */
      beforeDashboard?: React.ComponentType<any>[]
      /**
       * Add custom components before the email/password field
       */
      beforeLogin?: React.ComponentType<any>[]
      /**
       * Add custom components before the navigation links
       */
      beforeNavLinks?: React.ComponentType<any>[]
      /** Replace graphical components */
      graphics?: {
        /** Replace the icon in the navigation */
        Icon?: React.ComponentType<any>
        /** Replace the logo on the login page */
        Logo?: React.ComponentType<any>
      }
      /** Replace logout related components */
      logout?: {
        /** Replace the logout button  */
        Button?: React.ComponentType<any>
      }
      /**
       * Wrap the admin dashboard in custom context providers
       */
      providers?: React.ComponentType<{ children: React.ReactNode }>[]
      /**
       * Replace or modify top-level admin routes, or add new ones:
       * + `Account` - `/admin/account`
       * + `Dashboard` - `/admin`
       * + `:path` - `/admin/:path`
       */
      views?: {
        /** Add custom admin views */
        [key: string]: AdminView
        /** Replace the account screen */
        Account?: AdminView
        /** Replace the admin homepage */
        Dashboard?: AdminView
      }
    }
    /** Absolute path to a stylesheet that you can use to override / customize the Admin panel styling. */
    css?: string
    /** Global date format that will be used for all dates in the Admin panel. Any valid date-fns format pattern can be used. */
    dateFormat?: string
    /** If set to true, the entire Admin panel will be disabled. */
    disable?: boolean
    /** The route the user will be redirected to after being inactive for too long. */
    inactivityRoute?: string
    livePreview?: LivePreviewConfig & {
      collections?: string[]
      globals?: string[]
    }
    /** The route for the logout page. */
    logoutRoute?: string
    /** Base meta data to use for the Admin panel. Included properties are titleSuffix, ogImage, and favicon. */
    meta?: {
      /**
       * Public path to an icon
       *
       * This image may be displayed in the browser next to the title of the page
       */
      favicon?: string
      /**
       * Public path to an image
       *
       * This image may be displayed as preview when the link is shared on social media
       */
      ogImage?: string
      /**
       * String to append to the <title> of admin pages
       * @example `" - My Brand"`
       */
      titleSuffix?: string
    }
    /** The slug of a Collection that you want be used to log in to the Admin dashboard. */
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
   * Replace the built-in components with custom ones
   */
  components?: { [key: string]: (() => JSX.Element) | JSX.Element }
  /**
   * Prefix a string to all cookies that Payload sets.
   *
   * @default "payload"
   */
  cookiePrefix?: string
  /** Either a whitelist array of URLS to allow CORS requests from, or a wildcard string ('*') to accept incoming requests from any domain. */
  cors?: '*' | string[]
  /** A whitelist array of URLs to allow Payload cookies to be accepted from as a form of CSRF protection. */
  csrf?: string[]

  /** Extension point to add your custom data. */
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
  editor: RichTextAdapter<any, any, any>
  /**
   * Email configuration options. This value is overridden by `email` in Payload.init if passed.
   *
   * @see https://payloadcms.com/docs/email/overview
   */
  email?: EmailOptions
  /** Custom REST endpoints */
  endpoints?: Endpoint[]
  /**
   * Express-specific middleware options such as compression and JSON parsing.
   *
   * @see https://payloadcms.com/docs/configuration/express
   */
  express?: {
    /** Control the way responses are compressed */
    compression?: {
      [key: string]: unknown
    }
    /** Control the way JSON is parsed */
    json?: {
      /** Defaults to 2MB  */
      limit?: number
    }
    /**
     * @deprecated express.middleware will be removed in a future version. Please migrate to express.postMiddleware.
     */
    middleware?: any[]
    postMiddleware?: any[]
    preMiddleware?: any[]
  }
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
  i18n?: I18nOptions
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
  /**
   * Limit heavy usage
   *
   * @default
   * {
   *   window: 15 * 60 * 1000, // 15 minutes,
   *   max: 500,
   * }
   */
  rateLimit?: {
    max?: number
    skip?: (req: PayloadRequest) => boolean
    trustProxy?: boolean
    window?: number
  }
  /** Control the routing structure that Payload binds itself to. */
  routes?: {
    /** @default "/admin" */
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
  /** Send anonymous telemetry data about general usage. */
  telemetry?: boolean
  /** Control how typescript interfaces are generated from your collections. */
  typescript?: {
    /** Disable declare block in generated types file */
    declare?: false
    /** Filename to write the generated types to */
    outputFile?: string
  }
  /**
   * Customize the handling of incoming file uploads for collections that have uploads enabled.
   */
  upload?: ExpressFileUploadOptions
}

export type SanitizedConfig = Omit<
  DeepRequired<Config>,
  'collections' | 'endpoint' | 'globals' | 'localization'
> & {
  collections: SanitizedCollectionConfig[]
  endpoints: Endpoint[]
  globals: SanitizedGlobalConfig[]
  localization: SanitizedLocalizationConfig | false
  paths: {
    config: string
    configDir: string
    rawConfig: string
  }
}

export type ClientConfig = Omit<SanitizedConfig, 'db' | 'endpoints'> & {
  collections: (Omit<SanitizedCollectionConfig, 'access' | 'endpoints' | 'fields' | 'hooks'> & {
    fields: ClientConfigField[]
  })[]
  globals: (Omit<SanitizedGlobalConfig, 'access' | 'endpoints' | 'fields' | 'hooks'> & {
    fields: ClientConfigField[]
  })[]
}

export type EntityDescription =
  | (() => string)
  | React.ComponentType<any>
  | Record<string, string>
  | string
