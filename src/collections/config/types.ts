/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import joi from 'joi';
import 'joi-extract-type';
import { PaginateModel, Document, PassportLocalModel } from 'mongoose';
import { DeepRequired } from 'ts-essentials';
import { Access } from '../../config/types';
import { Field } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types/payloadRequest';
import schema from './schema';

interface PayloadModel extends PaginateModel<Document>, PassportLocalModel<Document>{}

export type Collection = {
  Model: PayloadModel;
  config: CollectionConfig;
};

type PayloadCollectionConfigFromSchema = joi.extractType<typeof schema>

interface PayloadCollectionConfig extends PayloadCollectionConfigFromSchema {
  hooks: {
    beforeOperation: BeforeOperationHook[];
    beforeValidate: BeforeValidateHook[];
    beforeChange: BeforeChangeHook[];
    afterChange: AfterChangeHook[];
    beforeRead: BeforeReadHook[];
    afterRead: AfterReadHook[];
    beforeDelete: BeforeDeleteHook[];
    afterDelete: AfterDeleteHook[];
    beforeLogin: BeforeLoginHook[];
    afterLogin: AfterLoginHook[];
    afterForgotPassword: AfterForgotPasswordHook[];
  }
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
    unlock: Access;
  };
}

export type CollectionConfig = DeepRequired<PayloadCollectionConfig>

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
