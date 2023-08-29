import type { CollectionPermission, GlobalPermission } from '../../auth/types.js';
import type { Field, FieldAffectingData, TabAsField, UIField } from '../../fields/config/types.js';

export type EntityPolicies = {
  collections?: {
    [collectionSlug: string]: CollectionPermission;
  };
  globals?: {
    [globalSlug: string]: GlobalPermission;
  };
};

export type PathToQuery = {
  collectionSlug?: string
  complete: boolean
  field: Field | TabAsField
  fields?: (FieldAffectingData | TabAsField | UIField)[]
  globalSlug?: string
  invalid?: boolean
  path: string
}
