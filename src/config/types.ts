import { Express, NextFunction, Response } from 'express';
import { DeepRequired } from 'ts-essentials';
import { Transporter } from 'nodemailer';
import { Options } from 'express-fileupload';
import { Configuration } from 'webpack';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import GraphQL from 'graphql';
import { ConnectOptions } from 'mongoose';
import React from 'react';
import { LoggerOptions } from 'pino';
import { Payload } from '..';
import { AfterErrorHook, CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types';
import { GlobalConfig, SanitizedGlobalConfig } from '../globals/config/types';
import { PayloadRequest } from '../express/types';
import { Where } from '../types';
import { User } from '../auth/types';

type Email = {
  fromName: string;
  fromAddress: string;
  logMockCredentials?: boolean;
}

// eslint-disable-next-line no-use-before-define
export type Plugin = (config: Config) => Config;

type GeneratePreviewURLOptions = {
  locale: string
  token: string
}

export type GeneratePreviewURL = (doc: Record<string, unknown>, options: GeneratePreviewURLOptions) => Promise<string> | string

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
export function hasTransport(emailConfig: EmailOptions): emailConfig is EmailTransport {
  return (emailConfig as EmailTransport).transport !== undefined;
}

/**
 * type guard for EmailOptions
 * @param emailConfig
 */
export function hasTransportOptions(emailConfig: EmailOptions): emailConfig is EmailTransportOptions {
  return (emailConfig as EmailTransportOptions).transportOptions !== undefined;
}


export type InitOptions = {
  /** Express app for Payload to use */
  express?: Express;
  mongoURL: string | false;
  mongoOptions?: ConnectOptions;

  /** Secure string that Payload will use for any encryption workflows */
  secret: string;

  /**
   * Configuration for Payload's email functionality
   *
   * https://payloadcms.com/docs/email/overview
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
};

export type AccessResult = boolean | Where;

type AccessArgs<T = any, U = any> = {
  req: PayloadRequest<U>
  id?: string | number
  data?: T
}

/**
 * Access function
 */
export type Access<T = any, U = any> = (args: AccessArgs<T, U>) => AccessResult | Promise<AccessResult>;

export interface PayloadHandler {
  (
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): void
}

export type Endpoint = {
  path: string
  method: 'get' | 'head' | 'post' | 'put' | 'patch' | 'delete' | 'connect' | 'options' | string
  handler: PayloadHandler | PayloadHandler[]
  root?: boolean
}

export type AdminView = React.ComponentType<{ user: User, canAccessAdmin: boolean }>

export type AdminRoute = {
  Component: AdminView
  path: string
  exact?: boolean
  strict?: boolean
  sensitive?: boolean
}

export type LocalizationConfig = {
  locales: string[]
  defaultLocale: string
  fallback?: boolean
}

export type Config = {
  admin?: {
    user?: string;
    meta?: {
      titleSuffix?: string;
      ogImage?: string;
      favicon?: string;
    }
    disable?: boolean;
    indexHTML?: string;
    css?: string
    dateFormat?: string
    avatar?: 'default' | 'gravatar' | React.ComponentType<any>,
    components?: {
      routes?: AdminRoute[]
      providers?: React.ComponentType<{ children: React.ReactNode }>[]
      beforeDashboard?: React.ComponentType<any>[]
      afterDashboard?: React.ComponentType<any>[]
      beforeLogin?: React.ComponentType<any>[]
      afterLogin?: React.ComponentType<any>[]
      beforeNavLinks?: React.ComponentType<any>[]
      afterNavLinks?: React.ComponentType<any>[]
      Nav?: React.ComponentType<any>
      graphics?: {
        Icon?: React.ComponentType<any>
        Logo?: React.ComponentType<any>
      }
      views?: {
        Account?: React.ComponentType<any>
        Dashboard?: React.ComponentType<any>
      }
    }
    pagination?: {
      defaultLimit?: number;
      options?: number[];
    }
    webpack?: (config: Configuration) => Configuration;
  };
  collections?: CollectionConfig[];
  endpoints?: Endpoint[];
  globals?: GlobalConfig[];
  serverURL?: string;
  cookiePrefix?: string;
  csrf?: string[];
  cors?: string[] | '*';
  routes?: {
    api?: string;
    admin?: string;
    graphQL?: string;
    graphQLPlayground?: string;
  };
  typescript?: {
    outputFile?: string
  }
  debug?: boolean
  express?: {
    json?: {
      limit?: number
    },
    compression?: {
      [key: string]: unknown
    },
    /**
     * @deprecated express.middleware will be removed in a future version. Please migrate to express.postMiddleware.
     */
    middleware?: any[]
    preMiddleware?: any[]
    postMiddleware?: any[]
  },
  defaultDepth?: number;
  maxDepth?: number;
  defaultMaxTextLength?: number;
  indexSortableFields?: boolean;
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: PayloadRequest) => boolean;
  };
  upload?: Options;
  localization?: LocalizationConfig | false;
  graphQL?: {
    mutations?: ((graphQL: typeof GraphQL, payload: Payload) => Record<string, unknown>),
    queries?: ((graphQL: typeof GraphQL, payload: Payload) => Record<string, unknown>),
    maxComplexity?: number;
    disablePlaygroundInProduction?: boolean;
    disable?: boolean;
    schemaOutputFile?: string;
  };
  components?: { [key: string]: JSX.Element | (() => JSX.Element) };
  hooks?: {
    afterError?: AfterErrorHook;
  };
  plugins?: Plugin[];
  telemetry?: boolean;
  onInit?: (payload: Payload) => Promise<void> | void
};

export type SanitizedConfig = Omit<DeepRequired<Config>, 'collections' | 'globals'> & {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  paths: { [key: string]: string };
}

export type EntityDescription = string | (() => string) | React.ComponentType<any>
