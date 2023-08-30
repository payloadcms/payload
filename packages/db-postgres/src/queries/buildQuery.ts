import { Where } from 'payload/types';
import { Field } from 'payload/types';
import { QueryError } from 'payload/errors';
import { SQL } from 'drizzle-orm';
import { parseParams } from './parseParams.js';
import { PostgresAdapter } from '../types.js';

type BuildQueryArgs = {
  adapter: PostgresAdapter
  where: Where
  locale?: string
  collectionSlug?: string
  globalSlug?: string
  versionsFields?: Field[]
}

const buildQuery = async function buildQuery({
  adapter,
  where,
  locale,
  collectionSlug,
  globalSlug,
  versionsFields,
}: BuildQueryArgs): Promise<SQL> {
  let fields = versionsFields;
  if (!fields) {
    if (globalSlug) {
      const globalConfig = adapter.payload.globals.config.find(({ slug }) => slug === globalSlug);
      fields = globalConfig.fields;
    }
    if (collectionSlug) {
      const collectionConfig = adapter.payload.collections[collectionSlug].config;
      fields = collectionConfig.fields;
    }
  }
  const errors = [];
  const result = await parseParams({
    collectionSlug,
    fields,
    globalSlug,
    adapter,
    locale,
    where,
  });

  if (errors.length > 0) {
    throw new QueryError(errors);
  }

  return result;
};

export default buildQuery;
