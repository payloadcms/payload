import { CollectionPermission, GlobalPermission } from '../../auth';
import { Field, FieldAffectingData, TabAsField, UIField } from '../../fields/config/types';

export const validOperators = ['like', 'contains', 'in', 'all', 'not_in', 'greater_than_equal', 'greater_than', 'less_than_equal', 'less_than', 'not_equals', 'equals', 'exists', 'near'];

export type EntityPolicies = {
  collections?: {
    [collectionSlug: string]: CollectionPermission;
  };
  globals?: {
    [globalSlug: string]: GlobalPermission;
  };
};

export type PathToQuery = {
  complete: boolean
  collectionSlug?: string
  globalSlug?: string
  path: string
  field: Field | TabAsField
  fields?: (FieldAffectingData | UIField | TabAsField)[]
  invalid?: boolean
}
