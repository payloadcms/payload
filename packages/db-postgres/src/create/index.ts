import { Create } from 'payload/dist/database/types';
import toSnakeCase from 'to-snake-case';
import { insertRows } from './insertRows';

export const create: Create = async function create({
  collection: collectionSlug,
  data,
  // fallbackLocale,
  locale,
}) {
  const collection = this.payload.collections[collectionSlug].config;

  return insertRows({
    adapter: this,
    data,
    fallbackLocale: false,
    fields: collection.fields,
    locale,
    tableName: toSnakeCase(collectionSlug),
  });
};
