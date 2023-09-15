import type { Create } from 'payload/database';

import toSnakeCase from 'to-snake-case';

import { upsertRow } from '../upsertRow';

export const create: Create = async function create({
  collection: collectionSlug,
  data,
  req,
}) {
  const db = req.transactionID ? this.sessions[req.transactionID] : this.db;
  const collection = this.payload.collections[collectionSlug].config;

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'create',
    tableName: toSnakeCase(collectionSlug),
  });

  return result;
};
