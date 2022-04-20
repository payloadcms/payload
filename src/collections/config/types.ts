/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeepRequired } from 'ts-essentials';
import { PaginateModel } from 'mongoose';
import { GraphQLType } from 'graphql';
import { Access, GeneratePreviewURL, EntityDescription } from '../../config/types';
import { Field } from '../../fields/config/types';
import { PayloadRequest } from '../../express/types';
import { IncomingAuthType, Auth } from '../../auth/types';
import { IncomingUploadType, Upload } from '../../uploads/types';
import { IncomingCollectionVersions, SanitizedCollectionVersions } from '../../versions/types';

type Register<T = any> = (doc: T, password: string) => T;

interface PassportLocalModel {
  register: Register
  authenticate: any
}

export interface CollectionModel extends PaginateModel<any>, PassportLocalModel {
  buildQuery: (query: unknown, locale?: string) => Record<string, unknown>
}

export interface AuthCollectionModel extends CollectionModel {
  resetPasswordToken: string;
  resetPasswordExpiration: Date;
}

export type HookOperationType =
| 'create'
| 'autosave'
| 'read'
| 'update'
| 'delete'
| 'refresh'
| 'login'
| 'forgotPassword';

type CreateOrUpdateOperation = Extract<HookOperationType, 'create' | 'update'>;

export type BeforeOperationHook = (args: {
  args?: any;
  /**
   * Hook operation being performed
   */
  operation: HookOperationType;
}) => any;

export type BeforeValidateHook<T extends TypeWithID = any> = (args: {
  data?: Partial<T>;
  req?: PayloadRequest;
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation;
  /**
   * Original document before change
   *
   * `undefined` on 'create' operation
   */
  originalDoc?: T;
}) => any;

export type BeforeChangeHook<T extends TypeWithID = any> = (args: {
  data: Partial<T>;
  req: PayloadRequest;
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation;
  /**
   * Original document before change
   *
   * `undefined` on 'create' operation
   */
  originalDoc?: T;
}) => any;

export type AfterChangeHook<T extends TypeWithID = any> = (args: {
  doc: T;
  req: PayloadRequest;
  /**
   * Hook operation being performed
   */
  operation: CreateOrUpdateOperation;
}) => any;

export type BeforeReadHook<T extends TypeWithID = any> = (args: {
  doc: T;
  req: PayloadRequest;
  query: { [key: string]: any };
}) => any;

export type AfterReadHook<T extends TypeWithID = any> = (args: {
  doc: T;
  req: PayloadRequest;
  query?: { [key: string]: any };
}) => any;

export type BeforeDeleteHook = (args: {
  req: PayloadRequest;
  id: string;
}) => any;

export type AfterDeleteHook<T extends TypeWithID = any> = (args: {
  doc: T;
  req: PayloadRequest;
  id: string;
}) => any;

export type AfterErrorHook = (err: Error, res: unknown) => { response: any, status: number } | void;

export type BeforeLoginHook = (args: {
  req: PayloadRequest;
}) => any;

export type AfterLoginHook<T extends TypeWithID = any> = (args: {
  req: PayloadRequest;
  doc: T;
  token: string;
}) => any;

export type AfterForgotPasswordHook = (args: {
  args?: any;
}) => any;

export type CollectionAdminOptions = {
  /**
   * Field to use as title in Edit view and first column in List view
   */
  useAsTitle?: string;
  /**
   * Default columns to show in list view
   */
  defaultColumns?: string[];
  /**
   * Custom description for collection
   */
  description?: EntityDescription;
  disableDuplicate?: boolean;
  /**
   * Hide the API URL within the Edit view
   */
  hideAPIURL?: boolean
  /**
   * Custom admin components
   */
  components?: {
    views?: {
      Edit?: React.ComponentType
      List?: React.ComponentType
    }
  };
  pagination?: {
    defaultLimit?: number
    limits?: number[]
  }
  enableRichTextRelationship?: boolean
  /**
   * Function to generate custom preview URL
   */
  preview?: GeneratePreviewURL
}

export type CollectionConfig = {
  slug: string;
  /**
   * Label configuration
   */
  labels?: {
    singular?: string;
    plural?: string;
  };
  fields: Field[];
  /**
   * Collection admin options
   */
  admin?: CollectionAdminOptions;
  /**
   * Hooks to modify Payload functionality
   */
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
  /**
   * Access control
   */
  access?: {
    create?: Access;
    read?: Access;
    readVersions?: Access;
    update?: Access;
    delete?: Access;
    admin?: (args?: any) => boolean;
    unlock?: Access;
  };
  /**
   * Collection login options
   *
   * Use `true` to enable with default options
   */
  auth?: IncomingAuthType | boolean;
  /**
   * Upload options
   */
  upload?: IncomingUploadType | boolean;
  versions?: IncomingCollectionVersions | boolean;
  timestamps?: boolean
};

export interface SanitizedCollectionConfig extends Omit<DeepRequired<CollectionConfig>, 'auth' | 'upload' | 'fields' | 'versions'> {
  auth: Auth;
  upload: Upload;
  fields: Field[];
  versions: SanitizedCollectionVersions
}

export type Collection = {
  Model: CollectionModel;
  config: SanitizedCollectionConfig;
  graphQL?: {
    [key: string]: GraphQLType
  }
};

export type AuthCollection = {
  Model: AuthCollectionModel;
  config: SanitizedCollectionConfig;
}

export type TypeWithID = {
  id: string | number
}

export type TypeWithTimestamps = {
  id: string | number
  createdAt: string
  updatedAt: string
}
