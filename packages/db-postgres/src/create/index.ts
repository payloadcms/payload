import type { Create } from 'payload/database';

import toSnakeCase from 'to-snake-case';

import { upsertRow } from '../upsertRow';

export const create: Create = async function create({
  collection: collectionSlug,
  data,
  req,
}) {
  const collection = this.payload.collections[collectionSlug].config;

  const result = await upsertRow({
    adapter: this,
    data,
    fallbackLocale: req.fallbackLocale,
    fields: collection.fields,
    locale: req.locale,
    operation: 'create',
    tableName: toSnakeCase(collectionSlug),
  });

  return result;
};
