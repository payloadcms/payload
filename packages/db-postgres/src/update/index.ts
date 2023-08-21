import { UpdateOne } from 'payload/dist/database/types';
import toSnakeCase from 'to-snake-case';
import { upsertRow } from '../upsertRow';
import buildQuery from '../queries/buildQuery';

export const updateOne: UpdateOne = async function updateOne({
  collection: collectionSlug,
  data,
  req,
  where,
  draft,
  locale,
}) {
  const collection = this.payload.collections[collectionSlug].config;

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    locale,
    where,
  });

  const result = await upsertRow({
    adapter: this,
    data,
    fallbackLocale: req.fallbackLocale,
    fields: collection.fields,
    locale: req.locale,
    operation: 'update',
    query,
    tableName: toSnakeCase(collectionSlug),
  });

  return result;
};
