import { TypeWithTimestamps } from '../collections/config/types.js';
import { validOperators } from './constants.js';

export type { PayloadRequest } from '../express/types';

export type Operator = typeof validOperators[number];

export type WhereField = {
  [key in Operator]?: unknown;
};

export type Where = {
  [key: string]: WhereField | Where[];
  or?: Where[];
  and?: Where[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Document = any;

export type Operation = 'create' | 'read' | 'update' | 'delete';
export type VersionOperations = 'readVersions';
export type AuthOperations = 'unlock';
export type AllOperations = Operation | VersionOperations | AuthOperations;

export function docHasTimestamps(doc: any): doc is TypeWithTimestamps {
  return doc?.createdAt && doc?.updatedAt;
}
