// TODO: Split out init options from config types into own file

import { Express, Request } from 'express';
import { Transporter } from 'nodemailer';

export type PayloadEmailOptions = {
  transport: 'mock' | Transporter; // Not positive Transporter is correct type
  fromName: string;
  fromAddress: string;
};

export type PayloadInitOptions = {
  express?: Express;
  mongoURL: string;
  secret: string;
  license?: string;
  email?: PayloadEmailOptions;
  local?: boolean; // I have no idea what this is
  onInit?: () => void;
};

export type Document = {
  id: string;
};

export type CreateOptions = {
  collection: string;
  data: any;
};

export type FindOptions = {
  collection: string;
  where?: { [key: string]: any };
};

export type FindResponse = {
  docs: Document[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type FindGlobalOptions = {
  global: string;
};
export type UpdateGlobalOptions = {
  global: string;
  data: any;
};

export type FindByIDOptions = {
  collection: string;
  id: string;
};
export type UpdateOptions = {
  collection: string;
  id: string;
  data: any;
};

export type DeleteOptions = {
  collection: string;
  id: string;
};

export type ForgotPasswordOptions = {
  collection: string;
  generateEmailHTML?: (token: string) => string;
  expiration: Date;
  data: any;
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

export type PayloadField = {
  name: string;
  label: string;
  type:
    | 'number'
    | 'text'
    | 'email'
    | 'textarea'
    | 'richText'
    | 'code'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'upload'
    | 'relationship'
    | 'row'
    | 'array'
    | 'group'
    | 'select'
    | 'blocks';
  localized?: boolean;
  fields?: PayloadField[];
  admin?: {
    position?: string;
    width?: string;
    style?: Object;
  };
};

export type PayloadCollectionHook = (...args: any[]) => any | void;
export type PayloadAccess = (args?: any) => boolean;

export type PayloadCollection = {
  slug: string;
  labels?: {
    singular: string;
    plural: string;
  };
  admin?: {
    useAsTitle?: string;
    defaultColumns?: string[];
    components?: any;
  };
  hooks?: {
    beforeOperation?: PayloadCollectionHook[];
    beforeValidate?: PayloadCollectionHook[];
    beforeChange?: PayloadCollectionHook[];
    afterChange?: PayloadCollectionHook[];
    beforeRead?: PayloadCollectionHook[];
    afterRead?: PayloadCollectionHook[];
    beforeDelete?: PayloadCollectionHook[];
    afterDelete?: PayloadCollectionHook[];
  };
  access?: {
    create?: PayloadAccess;
    read?: PayloadAccess;
    update?: PayloadAccess;
    delete?: PayloadAccess;
    admin?: PayloadAccess;
  };
  auth?: {
    tokenExpiration?: number;
    verify?:
      | boolean
      | { generateEmailHTML: string; generateEmailSubject: string };
    maxLoginAttempts?: number;
    lockTime?: number;
    useAPIKey?: boolean;
    cookies?:
      | {
          secure?: boolean;
          sameSite?: string;
          domain?: string | undefined;
        }
      | boolean;
  };
  fields: PayloadField[];
};

export type PayloadGlobal = {
  slug: string;
  label: string;
  access?: {
    create?: PayloadAccess;
    read?: PayloadAccess;
    update?: PayloadAccess;
    delete?: PayloadAccess;
    admin?: PayloadAccess;
  };
  fields: PayloadField[];
};

export type PayloadConfig = {
  admin?: {
    user?: string;
    meta?: {
      titleSuffix?: string;
      ogImage?: string;
      favicon?: string;
    };
    disable?: boolean;
  };
  collections?: PayloadCollection[];
  globals?: PayloadGlobal[];
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
  email?: PayloadEmailOptions;
  local?: boolean;
  defaultDepth?: number;
  rateLimit?: {
    window?: number;
    max?: number;
    trustProxy?: boolean;
    skip?: (req: Request) => boolean; // TODO: Type join Request w/ PayloadRequest
  };
  upload?: {
    limits: {
      fileSize: number;
    };
  };
  localization?: {
    locales: string[];
  };
  defaultLocale?: string;
  fallback?: boolean;
  graphQL?: {
    mutations?: Object;
    queries?: Object;
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
