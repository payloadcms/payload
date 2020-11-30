/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeepRequired } from 'ts-essentials';
import { PaginateModel, Document as MongooseDocument, PassportLocalModel } from 'mongoose';
import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';
import { Document } from '../../types';
import { PayloadRequest } from '../../express/types/payloadRequest';
import { IncomingAuthType, Auth } from '../../auth/types';
import { IncomingUploadType, Upload } from '../../uploads/types';

interface CollectionModel extends PaginateModel<MongooseDocument>, PassportLocalModel<MongooseDocument>{}

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

export type PayloadCollectionConfig = {
  slug: string;
  labels?: {
    singular?: string;
    plural?: string;
  };
  fields: Field[];
  admin?: {
    useAsTitle?: string;
    defaultColumns?: string[];
    components?: any;
    enableRichTextRelationship?: boolean
  };
  preview?: (doc: Document, token: string) => string
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

export interface CollectionConfig extends Omit<DeepRequired<PayloadCollectionConfig>, 'auth' | 'upload'> {
  auth: Auth;
  upload: Upload;
}

export type Collection = {
  Model: CollectionModel;
  config: CollectionConfig;
};

export type PaginatedDocs = {
  docs: unknown[]
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
