declare module "@payloadcms/payload" {
  interface PayloadEmailOptions {
    transport: 'mock'; // TODO: import nodemailer Mail type
    fromName?: string;
    fromAddress?: string;
  }

  interface PayloadInitOptions {
    express: any,
    mongoURL: string,
    secret: string,
    email: PayloadEmailOptions,
    onInit?: () => void,
  }

  interface CreateOptions {
    collection: string;
    data: any;
  }

  interface FindOptions {
    collection: string;
  }

  interface FindGlobalOptions {
    global: string;
  }

  interface UpdateGlobalOptions {
    global: string;
    data: any;
  }

  interface FindByIDOptions {
    collection: string;
    id: string;
  }

  interface UpdateOptions {
    collection: string;
    id: string;
    data: any;
  }

  interface DeleteOptions {
    collection: string;
    id: string;
  }

  interface ForgotPasswordOptions {
    collection: string;
    generateEmailHTML?: (token: string) => string;
    expiration: Date;
    data: any;
  }

  interface SendEmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
  }

  interface MockEmailCredentials {
    user: string;
    pass: string;
    web: string;
  }

  class PayloadInstance {
    init(options: PayloadInitOptions): void;
    sendEmail(message: SendEmailOptions): void;
    getMockEmailCredentials(): MockEmailCredentials;
    create(options: CreateOptions): Promise<any>;
    find(options: FindOptions): Promise<any>;
    findGlobal(options: FindGlobalOptions): Promise<any>;
    updateGlobal(options: UpdateGlobalOptions): Promise<any>;
    findByID(options: FindByIDOptions): Promise<any>;
    update(options: UpdateOptions): Promise<any>;
    delete(options: DeleteOptions): Promise<any>;
    login(options: any): Promise<any>; // TODO: find example of this to type
    forgotPassword(options: ForgotPasswordOptions): Promise<any>;
    resetPassword(options: any): Promise<any>;
  }

  var payload: PayloadInstance;
  export = payload;
}

declare module "@payloadcms/payload/types" {

  interface PayloadField {
    name: string;
    label: string;
    type: 'number' | 'text' | 'email' | 'textarea' | 'richText' | 'code' | 'radio' | 'checkbox' | 'date' | 'upload' | 'relationship' | 'row' | 'array' | 'group' | 'select' | 'blocks';
    localized?: boolean;
    fields?: PayloadField[];
  }
  interface PayloadCollection {
    slug: string;
    labels: {
      singular: string;
      plural: string;
    },
    access?: {
      create?: (args?: any) => boolean;
      read?: (args?: any) => boolean;
      update?: (args?: any) => boolean;
      delete?: (args?: any) => boolean;
      admin?: (args?: any) => boolean;
    },
    fields: PayloadField[];
  }

  interface PayloadGlobal {
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
  interface PayloadConfig {
    admin?: {
      user?: string;
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
