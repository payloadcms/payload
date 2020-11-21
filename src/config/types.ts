import { Express } from 'express';
import { CSSProperties } from 'react';
import { Transporter } from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import { Collection } from '../collections/config/types';

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
  local?: boolean; // I have no idea what this is
  onInit?: () => void;
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

export type Hook = (...args: any[]) => any | void;
export type Access = (args?: any) => boolean;

export type Config = {
  admin?: {
    user?: string
    meta?: {
      titleSuffix?: string
      ogImage?: string
      favicon?: string
    }
    disable?: boolean
  };
  collections?: Collection[];
  globals?: Global[];
  serverURL?: string;
  cookiePrefix?: string;
  csrf?: string[];
  cors?: string[];
  publicENV: { [key: string]: string };
  routes?: {
    api?: string;
    admin?: string;
    graphQL?: string;
    graphQLPlayground?: string;
  };
  email?: EmailOptions;
  local?: boolean;
  defaultDepth?: number;
  maxDepth?: number;
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: Request) => boolean; // TODO: Type join Request w/ PayloadRequest
  };
  upload?: {
    limits?: {
      fileSize?: number;
    };
  };
  localization?: {
    locales: string[];
  };
  defaultLocale?: string;
  fallback?: boolean;
  graphQL?: {
    mutations?: {
      [key: string]: unknown
    },
    queries?: {
      [key: string]: unknown
    },
    maxComplexity?: number;
    disablePlaygroundInProduction?: boolean;
  };
  components: { [key: string]: JSX.Element | (() => JSX.Element) };
  paths?: { [key: string]: string };
  hooks?: {
    afterError?: () => void;
  };
  webpack?: (config: any) => any;
  serverModules?: string[];
};
