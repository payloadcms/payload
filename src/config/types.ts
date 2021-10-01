import { Express } from 'express';
import { DeepRequired } from 'ts-essentials';
import { Transporter } from 'nodemailer';
import { Options } from 'express-fileupload';
import { Configuration } from 'webpack';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import GraphQL from 'graphql';
import { ConnectionOptions } from 'mongoose';
import { Payload } from '..';
import { AfterErrorHook, CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types';
import { GlobalConfig, SanitizedGlobalConfig } from '../globals/config/types';
import { PayloadRequest } from '../express/types';
import { Where } from '../types';

type Email = {
  fromName: string;
  fromAddress: string;
}

// eslint-disable-next-line no-use-before-define
type Plugin = (config: Config) => Config;

type GeneratePreviewURLOptions = {
  locale: string
  token: string
}

export type GeneratePreviewURL = (doc: Record<string, unknown>, options: GeneratePreviewURLOptions) => string

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
  mongoOptions?: ConnectionOptions;
  secret: string;
  license?: string;
  email?: EmailOptions;
  local?: boolean;
  onInit?: (payload: Payload) => void;
};

export type AccessResult = boolean | Where;
export type Access = (args?: any) => AccessResult;

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
    webpack?: (config: Configuration) => Configuration;
  };
  collections?: CollectionConfig[];
  globals?: GlobalConfig[];
  serverURL: string;
  cookiePrefix?: string;
  csrf?: string[];
  cors?: string[] | '*';
  routes?: {
    api?: string;
    admin?: string;
    graphQL?: string;
    graphQLPlayground?: string;
  };
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
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: PayloadRequest) => boolean;
  };
  upload?: Options;
  localization?: {
    locales: string[]
    defaultLocale: string
    fallback?: boolean
  };
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
  plugins?: Plugin[]
};

export type SanitizedConfig = Omit<DeepRequired<Config>, 'collections' | 'globals'> & {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
  paths: { [key: string]: string };
}
