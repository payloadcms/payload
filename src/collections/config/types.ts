/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginateModel, Document, PassportLocalModel } from 'mongoose';
import { DeepRequired } from 'ts-essentials';
import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types/payloadRequest';

interface PayloadModel extends PaginateModel<Document>, PassportLocalModel<Document>{}

export type Collection = {
  Model: PayloadModel;
  config: CollectionConfig;
};

export type CollectionConfig = DeepRequired<PayloadCollectionConfig>

export type PayloadCollectionConfig = {
  slug: string;
  labels?: {
    singular: string;
    plural: string;
  };
  fields: Field[];
  admin?: {
    useAsTitle?: string;
    defaultColumns?: string[];
    components?: any;
  };
  hooks?: {
    beforeOperation?: BeforeOperationHook[];
    beforeValidate?: BeforeValidateHook[];
    beforeChange?: BeforeChangeHook[];
    afterChange?: AfterChangeHook[];
    beforeRead?: BeforeReadHook[];
    afterRead?: AfterReadHook[];
    beforeDelete?: BeforeDeleteHook[];
    afterDelete?: AfterDeleteHook[];
    beforeLogin?: BeforeLoginHook[];
    afterLogin?: AfterLoginHook[];
    afterForgotPassword?: AfterForgotPasswordHook[];
    afterError?: AfterErrorHook;
  };
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
    unlock?: Access;
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
      domain?: string;
    }
    | boolean;
    forgotPassword?: {
      generateEmailHTML?: (args?: { token?: string, email?: string, req?: PayloadRequest }) => string,
      generateEmailSubject?: (args?: { req?: PayloadRequest }) => string,
    }
  };
  upload?: {
    imageSizes?: ImageSize[];
    staticURL?: string;
    staticDir?: string;
    adminThumbnail?: string;
  };
};

export type ImageSize = {
  name: string,
  width: number,
  height: number,
  crop: string, // comes from sharp package
};

// Hooks

export type HookOperationType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'refresh'
  | 'login'
  | 'forgotPassword';

export type BeforeOperationHook = (args?: {
  args?: any;
  operation: HookOperationType;
}) => any;

export type BeforeValidateHook = (args?: {
  data?: any;
  req?: PayloadRequest;
  operation: 'create' | 'update';
  originalDoc?: any; // undefined on 'create' operation
}) => any;

export type BeforeChangeHook = (args?: {
  data: any;
  req: PayloadRequest;
  operation: 'create' | 'update'
  originalDoc?: any; // undefined on 'create' operation
}) => any;

export type AfterChangeHook = (args?: {
  doc: any;
  req: PayloadRequest;
  operation: 'create' | 'update';
}) => any;

export type BeforeReadHook = (args?: {
  doc: any;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type AfterReadHook = (args?: {
  doc: any;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type BeforeDeleteHook = (args?: {
  req: PayloadRequest;
  id: string;
}) => any;

export type AfterDeleteHook = (args?: {
  req: PayloadRequest;
  id: string;
  doc: any;
}) => any;

export type BeforeLoginHook = (args?: {
  req: PayloadRequest;
}) => any;

export type AfterLoginHook = (args?: {
  req: PayloadRequest;
  user: any;
  token: string;
}) => any;

export type AfterForgotPasswordHook = (args?: {
  args?: any;
}) => any;

export type AfterErrorHook = (args?: { [p: string]: any }, response?: any) => any;
