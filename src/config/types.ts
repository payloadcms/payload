import { Express, NextFunction, Response } from 'express';
import { DeepRequired } from 'ts-essentials';
import { Transporter } from 'nodemailer';
import { Options as ExpressFileUploadOptions } from 'express-fileupload';
import { Configuration } from 'webpack';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import GraphQL from 'graphql';
import { ConnectOptions } from 'mongoose';
import React from 'react';
import { LoggerOptions } from 'pino';
import type { InitOptions as i18nInitOptions } from 'i18next';
import { Payload } from '../payload';
import {
  AfterErrorHook,
  CollectionConfig,
  SanitizedCollectionConfig,
} from '../collections/config/types';
import { GlobalConfig, SanitizedGlobalConfig } from '../globals/config/types';
import { PayloadRequest } from '../express/types';
import { Where } from '../types';
import { User } from '../auth/types';

type Email = {
  fromName: string;
  fromAddress: string;
  logMockCredentials?: boolean;
};

// eslint-disable-next-line no-use-before-define
export type Plugin = (config: Config) => Promise<Config> | Config;

type GeneratePreviewURLOptions = {
  locale: string;
  token: string;
};

export type GeneratePreviewURL = (
  doc: Record<string, unknown>,
  options: GeneratePreviewURLOptions
) => Promise<string | null> | string | null;

export type EmailTransport = Email & {
  transport: Transporter;
  transportOptions?: SMTPConnection.Options;
};

export type EmailTransportOptions = Email & {
  transport?: Transporter;
  transportOptions: SMTPConnection.Options;
};

export type EmailOptions = EmailTransport | EmailTransportOptions | Email;

/**
 * type guard for EmailOptions
 * @param emailConfig
 */
export function hasTransport(
  emailConfig: EmailOptions,
): emailConfig is EmailTransport {
  return (emailConfig as EmailTransport).transport !== undefined;
}

/**
 * type guard for EmailOptions
 * @param emailConfig
 */
export function hasTransportOptions(
  emailConfig: EmailOptions,
): emailConfig is EmailTransportOptions {
  return (emailConfig as EmailTransportOptions).transportOptions !== undefined;
}

export type InitOptions = {
  /** Express app for Payload to use */
  express?: Express;
  /** Mongo connection URL, starts with `mongo` */
  mongoURL: string | false;
  /** Extra configuration options that will be passed to Mongo */
  mongoOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  };

  /** Secure string that Payload will use for any encryption workflows */
  secret: string;

  /**
   * Configuration for Payload's email functionality
   *
   * @see https://payloadcms.com/docs/email/overview
   */
  email?: EmailOptions;

  /**
   * Make Payload start in local-only mode.
   *
   * This will bypass setting up REST and GraphQL API routes.
   * Express will not be required if set to `true`.
   */
  local?: boolean;

  /**
   * A function that is called immediately following startup that receives the Payload instance as it's only argument.
   */
  onInit?: (payload: Payload) => Promise<void> | void;

  /**
   * Specify options for the built-in Pino logger that Payload uses for internal logging.
   *
   * See Pino Docs for options: https://getpino.io/#/docs/api?id=options
   */
  loggerOptions?: LoggerOptions;
  config?: Promise<SanitizedConfig>
};

/**
 * This result is calculated on the server
 * and then sent to the client allowing the dashboard to show accessible data and actions.
 *
 * If the result is `true`, the user has access.
 * If the result is an object, it is interpreted as a Mongo query.
 *
 * @example `{ createdBy: { equals: id } }`
 *
 * @example `{ tenant: { in: tenantIds } }`
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type AccessResult = boolean | Where;

export type AccessArgs<T = any, U = any> = {
  /** The original request that requires an access check */
  req: PayloadRequest<U>;
  /** ID of the resource being accessed */
  id?: string | number;
  /**
   * The relevant resource that is being accessed.
   *
   * `data` is null when a list is requested
   */
  data?: T;
};

/**
 * Access function runs on the server
 * and is sent to the client allowing the dashboard to show accessible data and actions.
 *
 * @see https://payloadcms.com/docs/access-control/overview
 */
export type Access<T = any, U = any> = (
  args: AccessArgs<T, U>
) => AccessResult | Promise<AccessResult>;

/** Equivalent to express middleware, but with an enhanced request object */
export interface PayloadHandler {
  (req: PayloadRequest, res: Response, next: NextFunction): void;
}

/**
 * Docs: https://payloadcms.com/docs/rest-api/overview#custom-endpoints
 */
export type Endpoint = {
  /**
   * Pattern that should match the path of the incoming request
   *
   * Compatible with the Express router
   */
  path: string;
  /** HTTP method (or "all") */
  method:
  | 'get'
  | 'head'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'connect'
  | 'options'
  | string;
  /**
   * Middleware that will be called when the path/method matches
   *
   * Compatible with Express middleware
   */
  handler: PayloadHandler | PayloadHandler[];
  /**
   * Set to `true` to disable the Payload middleware for this endpoint
   * @default false
   */
  root?: boolean;
};

export type AdminView = React.ComponentType<{
  user: User;
  canAccessAdmin: boolean;
}>;

export type AdminRoute = {
  Component: AdminView;
  path: string;
  /** Whether the path should be matched exactly or as a prefix */
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
};

/**
 * @see https://payloadcms.com/docs/configuration/localization#localization
 */
export type LocalizationConfig = {
  /**
   * List of supported locales
   * @exanple `["en", "es", "fr", "nl", "de", "jp"]`
   */
  locales: string[];
  /**
   * Locale for users that have not expressed their preference for a specific locale
   * @exanple `"en"`
   */
  defaultLocale: string;
  /** Set to `true` to let missing values in localised fields fall back to the values in `defaultLocale` */
  fallback?: boolean;
};

/**
 * This is the central configuration
 *
 * @see https://payloadcms.com/docs/configuration/overview
 */
export type Config = {
  /** Configure admin dashboard */
  admin?: {
    /** The slug of a Collection that you want be used to log in to the Admin dashboard. */
    user?: string;
    /** Base meta data to use for the Admin panel. Included properties are titleSuffix, ogImage, and favicon. */
    meta?: {
      /**
       * String to append to the <title> of admin pages
       * @example `" - My Brand"`
       */
      titleSuffix?: string;
      /**
       * Public path to an image
       *
       * This image may be displayed as preview when the link is shared on social media
       */
      ogImage?: string;
      /**
       * Public path to an icon
       *
       * This image may be displayed in the browser next to the title of the page
       */
      favicon?: string;
    };
    /** Specify an absolute path for where to store the built Admin panel bundle used in production. */
    buildPath?: string
    /** If set to true, the entire Admin panel will be disabled. */
    disable?: boolean;
    /** Replace the entirety of the index.html file used by the Admin panel. Reference the base index.html file to ensure your replacement has the appropriate HTML elements. */
    indexHTML?: string;
    /** Absolute path to a stylesheet that you can use to override / customize the Admin panel styling. */
    css?: string;
    /** Global date format that will be used for all dates in the Admin panel. Any valid date-fns format pattern can be used. */
    dateFormat?: string;
    /** Set account profile picture. Options: gravatar, default or a custom React component. */
    avatar?: 'default' | 'gravatar' | React.ComponentType<any>;
    /** The route for the logout page. */
    logoutRoute?: string;
    /** The route the user will be redirected to after being inactive for too long. */
    inactivityRoute?: string;
    /**
     * Add extra and/or replace built-in components with custom components
     *
     * @see https://payloadcms.com/docs/admin/components
     */
    components?: {
      /**
       * Add custom routes in the admin dashboard
       */
      routes?: AdminRoute[];
      /**
       * Wrap the admin dashboard in custom context providers
       */
      providers?: React.ComponentType<{ children: React.ReactNode }>[];
      /**
       * Add custom components before the collection overview
       */
      beforeDashboard?: React.ComponentType<any>[];
      /**
       * Add custom components after the collection overview
       */
      afterDashboard?: React.ComponentType<any>[];
      /**
      * Add custom components before the email/password field
      */
      beforeLogin?: React.ComponentType<any>[];
      /**
       * Add custom components after the email/password field
       */
      afterLogin?: React.ComponentType<any>[];
      /**
       * Add custom components before the navigation links
       */
      beforeNavLinks?: React.ComponentType<any>[];
      /**
       * Add custom components after the navigation links
       */
      afterNavLinks?: React.ComponentType<any>[];
      /**
       * Replace the navigation with a custom component
       */
      Nav?: React.ComponentType<any>;
      /** Replace logout related components */
      logout?: {
        /** Replace the logout button  */
        Button?: React.ComponentType<any>;
      };
      /** Replace graphical components */
      graphics?: {
        /** Replace the icon in the navigation */
        Icon?: React.ComponentType<any>;
        /** Replace the logo on the login page */
        Logo?: React.ComponentType<any>;
      };
      /* Replace complete pages */
      views?: {
        /** Replace the account screen */
        Account?: React.ComponentType<any>;
        /** Replace the admin homepage */
        Dashboard?: React.ComponentType<any>;
      };
    };
    /** Customize the Webpack config that's used to generate the Admin panel. */
    webpack?: (config: Configuration) => Configuration;
  };
  /**
   * Manage the datamodel of your application
   *
   * @see https://payloadcms.com/docs/configuration/collections#collection-configs
   */
  collections?: CollectionConfig[];
  /** Custom REST endpoints */
  endpoints?: Endpoint[];
  /**
   * @see https://payloadcms.com/docs/configuration/globals#global-configs
   */
  globals?: GlobalConfig[];
  /**
   * Control the behaviour of the admin internationalisation.
   *
   * See i18next options.
   *
   * @default
   * {
   *   fallbackLng: 'en',
   *   debug: false,
   *   supportedLngs: Object.keys(translations),
   *   resources: translations,
   * }
   */
  i18n?: i18nInitOptions;
  /**
   * Define the absolute URL of your app including the protocol, for example `https://example.org`.
   * No paths allowed, only protocol, domain and (optionally) port.
   *
   * @see https://payloadcms.com/docs/configuration/overview#options
   */
  serverURL?: string;
  /**
   * Prefix a string to all cookies that Payload sets.
   *
   * @default "payload"
   */
  cookiePrefix?: string;
  /** A whitelist array of URLs to allow Payload cookies to be accepted from as a form of CSRF protection. */
  csrf?: string[];
  /** Either a whitelist array of URLS to allow CORS requests from, or a wildcard string ('*') to accept incoming requests from any domain. */
  cors?: string[] | '*';
  /** Control the routing structure that Payload binds itself to. */
  routes?: {
    /** Defaults to /api  */
    api?: string;
    /** Defaults to /admin */
    admin?: string;
    /** Defaults to /graphql  */
    graphQL?: string;
    /** Defaults to /playground */
    graphQLPlayground?: string;
  };
  /** Control how typescript interfaces are generated from your collections. */
  typescript?: {
    /** Filename to write the generated types to */
    outputFile?: string;
  };
  /** Enable to expose more detailed error information. */
  debug?: boolean;
  /**
   * Express-specific middleware options such as compression and JSON parsing.
   *
   * @see https://payloadcms.com/docs/configuration/express
   */
  express?: {
    /** Control the way JSON is parsed */
    json?: {
      /** Defaults to 2MB  */
      limit?: number;
    };
    /** Control the way responses are compressed */
    compression?: {
      [key: string]: unknown;
    };
    /**
     * @deprecated express.middleware will be removed in a future version. Please migrate to express.postMiddleware.
     */
    middleware?: any[];
    preMiddleware?: any[];
    postMiddleware?: any[];
  };
  /**
   * If a user does not specify `depth` while requesting a resource, this depth will be used.
   *
   * @see https://payloadcms.com/docs/getting-started/concepts#depth
   *
   * @default 2
   */
  defaultDepth?: number;
  /**
   * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
   *
   * @see https://payloadcms.com/docs/getting-started/concepts#depth
   *
   * @default 10
   */
  maxDepth?: number;
  /**
   * The maximum allowed depth to be permitted application-wide. This setting helps prevent against malicious queries.
   *
   * @default 40000
   */
  defaultMaxTextLength?: number;
  /** Automatically index all sortable top-level fields in the database to improve sort performance and add database compatibility for Azure Cosmos and similar. */
  indexSortableFields?: boolean;
  /**
   * Limit heavy usage
   *
   * @default
   * {
   *   window: 15 * 60 * 100, // 1.5 minutes,
   *   max: 500,
   * }
  */
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: PayloadRequest) => boolean;
  };
  /**
   * Customize the handling of incoming file uploads for collections that have uploads enabled.
   */
  upload?: ExpressFileUploadOptions;
  /**
   * Translate your content to different languages/locales.
   *
   * @default false // disable localization
   */
  localization?: LocalizationConfig | false;
  /**
   * Manage the GraphQL API
   *
   * You can add your own GraphQL queries and mutations to Payload, making use of all the types that Payload has defined for you.
   *
   * @see https://payloadcms.com/docs/access-control/overview
   */
  graphQL?: {
    /**
     * Function that returns an object containing keys to custom GraphQL mutations
     *
     * @see https://payloadcms.com/docs/access-control/overview
     */
    mutations?: (
      graphQL: typeof GraphQL,
      payload: Payload
    ) => Record<string, unknown>;
    /**
    * Function that returns an object containing keys to custom GraphQL queries
    *
    * @see https://payloadcms.com/docs/access-control/overview
    */
    queries?: (
      graphQL: typeof GraphQL,
      payload: Payload
    ) => Record<string, unknown>;
    maxComplexity?: number;
    disablePlaygroundInProduction?: boolean;
    disable?: boolean;
    schemaOutputFile?: string;
  };
  /**
   * Replace the built-in components with custom ones
   */
  components?: { [key: string]: JSX.Element | (() => JSX.Element) };
  /**
   * Tap into Payload-wide hooks.
   *
   * @see https://payloadcms.com/docs/hooks/overview
   */
  hooks?: {
    afterError?: AfterErrorHook;
  };
  /**
   * An array of Payload plugins.
   *
   * @see https://payloadcms.com/docs/plugins/overview
   */
  plugins?: Plugin[];
  /** Send anonymous telemetry data about general usage. */
  telemetry?: boolean;
  /** A function that is called immediately following startup that receives the Payload instance as its only argument. */
  onInit?: (payload: Payload) => Promise<void> | void;
};

export type SanitizedConfig = Omit<
  DeepRequired<Config>,
  'collections' | 'globals'
> & {
  collections: SanitizedCollectionConfig[];
  globals: SanitizedGlobalConfig[];
  paths: {
    configDir: string
    config: string
    rawConfig: string
  };
};

export type EntityDescription =
  | string
  | Record<string, string>
  | (() => string)
  | React.ComponentType<any>;
