import { PayloadRequest, Where } from '../types';
import { Field } from '../fields/config/types';
import QueryError from '../errors/QueryError';
import { parseParams } from './parseParams';

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: Field[]
}

export type BuildQueryArgs = {
  req: PayloadRequest
  where: Where
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
    async function buildQuery({ req, where, globalSlug }: BuildQueryArgs): Promise<Record<string, unknown>> {
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
        collectionSlug,
        fields,
        globalSlug,
        req,
        where,
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
