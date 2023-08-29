import { CollectionPermission, GlobalPermission } from '../../auth/types.js';
import { Field, FieldAffectingData, TabAsField, UIField } from '../../fields/config/types.js';

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
