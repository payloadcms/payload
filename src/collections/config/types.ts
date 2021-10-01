/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeepRequired } from 'ts-essentials';
import { PaginateModel, PassportLocalModel } from 'mongoose';
import { Access, GeneratePreviewURL } from '../../config/types';
import { Field } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types';
import { IncomingAuthType, Auth } from '../../auth/types';
import { IncomingUploadType, Upload } from '../../uploads/types';

export interface CollectionModel extends PaginateModel<any>, PassportLocalModel<any> {
  buildQuery: (query: unknown, locale?: string) => Record<string, unknown>
}

export interface AuthCollectionModel extends CollectionModel {
  resetPasswordToken: string;
  resetPasswordExpiration: Date;
}

export type HookOperationType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'refresh'
  | 'login'
  | 'forgotPassword';

export type BeforeOperationHook = (args: {
  args?: any;
  operation: HookOperationType;
}) => any;

export type BeforeValidateHook = (args: {
  data?: any;
  req?: PayloadRequest;
  operation: 'create' | 'update';
  originalDoc?: any; // undefined on 'create' operation
}) => any;

export type BeforeChangeHook = (args: {
  data: any;
  req: PayloadRequest;
  operation: 'create' | 'update'
  originalDoc?: any; // undefined on 'create' operation
}) => any;

export type AfterChangeHook = (args: {
  doc: any;
  req: PayloadRequest;
  operation: 'create' | 'update';
}) => any;

export type BeforeReadHook = (args: {
  doc: any;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type AfterReadHook = (args: {
  doc: any;
  req: PayloadRequest;
  query?: { [key: string]: any };
}) => any;

export type BeforeDeleteHook = (args: {
  req: PayloadRequest;
  id: string;
}) => any;

export type AfterDeleteHook = (args: {
  req: PayloadRequest;
  id: string;
  doc: any;
}) => any;

export type AfterErrorHook = (err: Error, res: unknown) => { response: any, status: number } | void;

export type BeforeLoginHook = (args: {
  req: PayloadRequest;
}) => any;

export type AfterLoginHook = (args: {
  req: PayloadRequest;
  doc: any;
  token: string;
}) => any;

export type AfterForgotPasswordHook = (args: {
  args?: any;
}) => any;

export type CollectionConfig = {
  slug: string;
  labels?: {
    singular?: string;
    plural?: string;
  };
  fields: Field[];
  admin?: {
    useAsTitle?: string;
    defaultColumns?: string[];
    description?: string | (() => string);
    disableDuplicate?: boolean;
    components?: {
      views?: {
        Edit?: React.ComponentType
        List?: React.ComponentType
      }
    };
    enableRichTextRelationship?: boolean
    preview?: GeneratePreviewURL
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
    afterError?: AfterErrorHook;
    beforeLogin?: BeforeLoginHook[];
    afterLogin?: AfterLoginHook[];
    afterForgotPassword?: AfterForgotPasswordHook[];
  };
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
    unlock?: Access;
  };
  auth?: IncomingAuthType | boolean;
  upload?: IncomingUploadType | boolean;
  timestamps?: boolean
};

export interface SanitizedCollectionConfig extends Omit<DeepRequired<CollectionConfig>, 'auth' | 'upload' | 'fields'> {
  auth: Auth;
  upload: Upload;
  fields: Field[];
}

export type Collection = {
  Model: CollectionModel;
  config: SanitizedCollectionConfig;
};

export type AuthCollection = {
  Model: AuthCollectionModel;
  config: SanitizedCollectionConfig;
}

export type PaginatedDocs = {
  docs: any[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}
