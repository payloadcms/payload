declare module "@payloadcms/payload" {
  export interface PayloadEmailOptions {
    transport: 'mock'; // TODO: import nodemailer Mail type
    fromName?: string;
    fromAddress?: string;
  }

  export interface PayloadInitOptions {
    express: any,
    mongoURL: string,
    secret: string,
    email: PayloadEmailOptions,
    onInit?: () => void,
  }

  export interface Document {
    id: string;
  }

  export interface CreateOptions {
    collection: string;
    data: any;
  }

  export interface FindOptions {
    collection: string;
  }

  export interface FindResponse {
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
  }

  export interface FindGlobalOptions {
    global: string;
  }
  export interface UpdateGlobalOptions {
    global: string;
    data: any;
  }

  export interface FindByIDOptions {
    collection: string;
    id: string;
  }
  export interface UpdateOptions {
    collection: string;
    id: string;
    data: any;
  }

  export interface DeleteOptions {
    collection: string;
    id: string;
  }

  export interface ForgotPasswordOptions {
    collection: string;
    generateEmailHTML?: (token: string) => string;
    expiration: Date;
    data: any;
  }

  export interface SendEmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
  }

  export interface MockEmailCredentials {
    user: string;
    pass: string;
    web: string;
  }

  class PayloadInstance {
    init(options: PayloadInitOptions): void;
    sendEmail(message: SendEmailOptions): void;
    getMockEmailCredentials(): MockEmailCredentials;
    create(options: CreateOptions): Promise<Document>;
    find(options: FindOptions): Promise<FindResponse>;
    findGlobal(options: FindGlobalOptions): Promise<Document>;
    updateGlobal(options: UpdateGlobalOptions): Promise<Document>;
    findByID(options: FindByIDOptions): Promise<Document>;
    update(options: UpdateOptions): Promise<Document>;
    delete(options: DeleteOptions): Promise<Document>;
    login(options: any): Promise<any>; // TODO: find example of this to type
    forgotPassword(options: ForgotPasswordOptions): Promise<any>;
    resetPassword(options: any): Promise<any>;
  }

  var payload: PayloadInstance;
  export default payload;
}

declare module "@payloadcms/payload/types" {

  export interface PayloadField {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'textarea' | 'richText' | 'code' | 'radio' | 'checkbox' | 'date' | 'upload' | 'relationship' | 'row' | 'array' | 'group' | 'select' | 'blocks';
    localized?: boolean;
    fields?: PayloadField[];
  }

  export type PayloadCollectionHook = (...args: any[]) => any | void;

  export interface PayloadCollection {
    slug: string;
    labels: {
      singular: string;
      plural: string;
    },
    admin?: {
      useAsTitle?: string;
      components?: any;
    },
    hooks?: {
      beforeValidate?: Array<PayloadCollectionHook>;
      beforeChange?: Array<PayloadCollectionHook>;
      afterChange?: Array<PayloadCollectionHook>;
      beforeRead?: Array<PayloadCollectionHook>;
      afterRead?: Array<PayloadCollectionHook>;
      beforeDelete?: Array<PayloadCollectionHook>;
      afterDelete?: Array<PayloadCollectionHook>;
    }
    access?: {
      create?: (args?: any) => boolean;
      read?: (args?: any) => boolean;
      update?: (args?: any) => boolean;
      delete?: (args?: any) => boolean;
      admin?: (args?: any) => boolean;
    },
    auth?: {
      tokenExpiration?: number;
      emailVerification?: boolean;
      useAPIKey?: boolean;
      cookies?: {
        secure?: boolean;
        sameSite?: string;
        domain?: string | undefined;
      }
    }
    fields: PayloadField[];
  }

  export interface PayloadGlobal {
    slug: string;
    label: string;
    access?: {
      create?: (args?: any) => boolean;
      read?: (args?: any) => boolean;
      update?: (args?: any) => boolean;
      delete?: (args?: any) => boolean;
      admin?: (args?: any) => boolean;
    };
    fields: PayloadField[];
  }

  export interface PayloadConfig {
    admin?: {
      user?: string;
      maxLoginAttempts?: number;
      lockTime?: number;
      meta?: {
        titleSuffix?: string;
      },
      disable?: boolean;
    };
    collections?: PayloadCollection[];
    globals?: PayloadGlobal[];
    routes?: {
      api?: string;
      admin?: string;
      graphQL?: string;
      graphQLPlayground?: string;
    };
    defaultDepth?: number,
    rateLimit?: {
      window?: number;
      max?: number;
    },
    localization?: {
      locales: string[]
    };
    defaultLocale?: string;
    fallback?: boolean;
    productionGraphQLPlayground?: boolean;
    hooks?: {
      afterError?: () => void;
    };
    webpack?: (config: any) => any;
  }
}
