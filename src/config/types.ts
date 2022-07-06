import { Express, Handler } from 'express';
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
  express?: Express;
  mongoURL: string;
  mongoOptions?: ConnectOptions;
  secret: string;
  email?: EmailOptions;
  local?: boolean;
  onInit?: (payload: Payload) => void;
  /** Pino LoggerOptions */
  loggerOptions?: LoggerOptions;
};

export type AccessResult = boolean | Where;

/**
 * Access function
 */
export type Access = (args?: any) => AccessResult | Promise<AccessResult>;

export type Endpoint = {
  path: string
  method: 'get' | 'head' | 'post' | 'put' | 'patch' | 'delete' | 'connect' | 'options' | string
  handler: Handler | Handler[]
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
    scss?: string
    dateFormat?: string
    components?: {
      routes?: AdminRoute[]
      providers?: React.ComponentType[]
      beforeDashboard?: React.ComponentType[]
      afterDashboard?: React.ComponentType[]
      beforeLogin?: React.ComponentType[]
      afterLogin?: React.ComponentType[]
      beforeNavLinks?: React.ComponentType[]
      afterNavLinks?: React.ComponentType[]
      Nav?: React.ComponentType
      graphics?: {
        Icon?: React.ComponentType
        Logo?: React.ComponentType
      }
      views?: {
        Account?: React.ComponentType
        Dashboard?: React.ComponentType
      }
    }
    pagination?: {
      defaultLimit?: number;
      options?: number[];
    }
    webpack?: (config: Configuration) => Configuration;
  };
  collections?: CollectionConfig[];
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
    middleware?: any[]
  },
  defaultDepth?: number;
  maxDepth?: number;
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
  };
  components?: { [key: string]: JSX.Element | (() => JSX.Element) };
  hooks?: {
    afterError?: AfterErrorHook;
  };
  plugins?: Plugin[];
  telemetry?: boolean;
};

export type SanitizedConfig = Omit<DeepRequired<Config>, 'collections' | 'globals'> & {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  paths: { [key: string]: string };
}

export type EntityDescription = string | (() => string) | React.ComponentType
