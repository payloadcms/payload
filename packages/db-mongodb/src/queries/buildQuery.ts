import { Where } from 'payload/dist/types';
import { Field } from 'payload/dist/fields/config/types';
import QueryError from 'payload/dist/errors/QueryError';
import { Payload } from 'payload';
import { parseParams } from './parseParams';

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: Field[]
}

export type BuildQueryArgs = {
  payload: Payload
  locale?: string
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
    async function buildQuery({ payload, locale, where, globalSlug }: BuildQueryArgs): Promise<Record<string, unknown>> {
      let fields = versionsFields;
      if (!fields) {
        if (globalSlug) {
          const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug);
          fields = globalConfig.fields;
        }
        if (collectionSlug) {
          const collectionConfig = payload.collections[collectionSlug].config;
          fields = collectionConfig.fields;
        }
      }
      const errors = [];
      const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        payload,
        locale,
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
