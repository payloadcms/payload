import { PayloadRequest } from '../express/types/payloadRequest';
import { Field } from '../fields/config/types';
import { Payload } from '../index';

export type Document = {
  id: string;
  [key: string]: unknown;
};

export type CreateOptions = {
  collection: string;
  data: any;
};

export type FindOptions = {
  collection: string;
  where?: { [key: string]: any };
  depth?: number;
  limit?: number;
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

export interface OperationArguments {
  data?: {[key: string]: any};
  originalDoc?: {[key: string]: any};
  fullOriginalDoc?: {[key: string]: any};
  fullData?: {[key: string]: any};
  operation?: unknown;
  hook?: string;
  req?: PayloadRequest;
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
