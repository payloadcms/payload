import { Response } from 'express';
import { AuthCollection, Collection } from '../collections/config/types';
import { PayloadRequest } from '../express/types/payloadRequest';
import { Field } from '../fields/config/types';
import { Payload } from '../index';

export { PayloadCollectionConfig } from '../collections/config/types';

export { FieldHook } from '../fields/config/types';

export type Where = {
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Document = any;

export type CreateOptions = {
  collection: string;
  data: {
    [key: string]: unknown
  };
};

export type FindOptions = {
  collection: string;
  where?: { [key: string]: unknown };
  depth?: number;
  limit?: number;
  sort?: string;
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
  data: {
    [key: string]: unknown
  };
};

export type FindByIDOptions = {
  collection: string;
  id: string;
};
export type UpdateOptions = {
  collection: string;
  id: string;
  data: {
    [key: string]: unknown
  };
};

export type DeleteOptions = {
  collection: string;
  id: string;
};

export type ForgotPasswordOptions = {
  collection: string;
  generateEmailHTML?: (token: string) => string;
  expiration: Date;
  data: {
    [key: string]: unknown
  };
};

export interface OperationArguments {
  collection: Collection;
  data?: {[key: string]: unknown};
  originalDoc?: Document;
  fullOriginalDoc?: {[key: string]: unknown};
  fullData?: {[key: string]: unknown};
  operation?: unknown;
  hook?: string;
  req?: PayloadRequest;
  res?: Response;
  id?: string;
  overrideAccess?: boolean;
  reduceLocales?: boolean;
  showHiddenFields?: boolean;
  currentDepth?: number;
  depth?: number | string;
  fields?: Field[];
  field?: Field;
  payload?: Payload;
  path?: string;
  locale?: string;
  fallbackLocale?: string;
  accessPromises?: Promise<void>[];
  hookPromises?: Promise<void>[];
  relationshipPopulations?: any[];
  performFieldOperations?: Promise<Document>;
  validationPromises?: any[];
  errors?: { message: any; field: string }[];
  newData?: {[key: string]: any};
  existingData?: {[key: string]: any};
  dataReference?: {[key: string]: any};
  index?: number | string;
}

export type AuthOperationArguments = Omit<OperationArguments, 'collection'> & {
  collection: AuthCollection;
  disableEmail?: boolean;
  expiration?: Date;
}

export type Operator = 'equals'
  | 'not_equals'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'greater_than'
  | 'greater_than_equals'
  | 'less_than'
  | 'less_than_equals'
  | 'like'
