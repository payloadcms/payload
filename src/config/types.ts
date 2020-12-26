import { Express } from 'express';
import { DeepRequired } from 'ts-essentials';
import { Transporter } from 'nodemailer';
import { Configuration } from 'webpack';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import GraphQL from 'graphql';
import { Payload } from '..';
import { AfterErrorHook, PayloadCollectionConfig, CollectionConfig } from '../collections/config/types';
import { PayloadGlobalConfig, GlobalConfig } from '../globals/config/types';
import { PayloadRequest } from '../express/types';
import InitializeGraphQL from '../graphql';
import { Where } from '../types';

type MockEmailTransport = {
  transport?: 'mock';
  fromName?: string;
  fromAddress?: string;
};

type ValidEmailTransport = {
  transport: Transporter;
  transportOptions?: SMTPConnection.Options;
  fromName: string;
  fromAddress: string;
};

export type EmailOptions = ValidEmailTransport | MockEmailTransport;

export type InitOptions = {
  express?: Express;
  mongoURL: string;
  secret: string;
  license?: string;
  email?: EmailOptions;
  local?: boolean;
  onInit?: (payload: Payload) => void;
};

export type SendEmailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type MockEmailCredentials = {
  user: string;
  pass: string;
  web: string;
};

export type AccessResult = boolean | Where;
export type Access = (args?: any) => AccessResult;

export type PayloadConfig = {
  admin?: {
    user?: string;
    meta?: {
      titleSuffix?: string;
      ogImage?: string;
      favicon?: string;
    }
    disable?: boolean;
    indexHTML?: string;
    components?: {
      Nav?: React.ComponentType
      Account?: React.ComponentType
      graphics?: {
        Icon?: React.ComponentType
        Logo?: React.ComponentType
      }
      views?: {
        Dashboard?: React.ComponentType
      }
    }
  };
  collections?: PayloadCollectionConfig[];
  globals?: PayloadGlobalConfig[];
  serverURL: string;
  cookiePrefix?: string;
  csrf?: string[];
  cors?: string[] | '*';
  publicENV?: { [key: string]: string };
  routes?: {
    api?: string;
    admin?: string;
    graphQL?: string;
    graphQLPlayground?: string;
  };
  debug?: boolean
  express?: {
    json: {
      limit?: number
    }
  },
  email?: EmailOptions;
  local?: boolean;
  defaultDepth?: number;
  maxDepth?: number;
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: PayloadRequest) => boolean;
  };
  upload?: {
    limits?: {
      fileSize?: number;
    };
  };
  localization?: {
    locales: string[]
    defaultLocale: string
    fallback?: boolean
  };
  defaultLocale?: string;
  fallback?: boolean;
  compression?: {
    [key: string]: unknown
  },
  graphQL?: {
    mutations?: {
      [key: string]: unknown
    } | ((graphQL: typeof GraphQL, payload: InitializeGraphQL) => any),
    queries?: {
      [key: string]: unknown
    } | ((graphQL: typeof GraphQL, payload: InitializeGraphQL) => any),
    maxComplexity?: number;
    disablePlaygroundInProduction?: boolean;
  };
  components?: { [key: string]: JSX.Element | (() => JSX.Element) };
  paths?: { [key: string]: string };
  hooks?: {
    afterError?: AfterErrorHook;
  };
  webpack?: (config: Configuration) => Configuration;
  middleware?: any[]
  serverModules?: string[];
};

export type Config = Omit<DeepRequired<PayloadConfig>, 'collections'> & {
  collections: CollectionConfig[]
  globals: GlobalConfig[]
}
