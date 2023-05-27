import { PayloadRequest, Where } from '../types';
import { Field, FieldAffectingData, TabAsField, UIField } from '../fields/config/types';
import { CollectionPermission, FieldPermissions, GlobalPermission } from '../auth';
import QueryError from '../errors/QueryError';
import { parseParams } from './parseParams';

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
  path: string
  field: Field | TabAsField
  fields?: (FieldAffectingData | UIField | TabAsField)[]
  fieldPolicies?: {
    [field: string]: FieldPermissions
  }
}

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: Field[]
}

export type BuildQueryArgs = {
  req: PayloadRequest
  where: Where
  overrideAccess: boolean
  access?: Where | boolean
  globalSlug?: string
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema) {
    const modifiedSchema = schema;
    async function buildQuery({ req, where, overrideAccess = false, access, globalSlug }: BuildQueryArgs): Promise<Record<string, unknown>> {
      let fields = versionsFields;
      if (!fields) {
        if (globalSlug) {
          const globalConfig = req.payload.globals.config.find(({ slug }) => slug === globalSlug);
          fields = globalConfig.fields;
        }
        if (collectionSlug) {
          const collectionConfig = req.payload.collections[collectionSlug].config;
          fields = collectionConfig.fields;
        }
      }
      const errors = [];
      const result = await parseParams({
        policies: {
          collections: {},
          globals: {},
        },
        collectionSlug,
        access,
        errors,
        fields,
        globalSlug,
        req,
        where,
        overrideAccess,
      });

      if (errors.length > 0) {
        throw new QueryError(errors);
      }

      return result;
    }
    modifiedSchema.statics.buildQuery = buildQuery;
  };
};

export default getBuildQueryPlugin;
