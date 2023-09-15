import type { UpdateOne } from 'payload/database';

import toSnakeCase from 'to-snake-case';

import buildQuery from '../queries/buildQuery';
import { upsertRow } from '../upsertRow';

export const updateOne: UpdateOne = async function updateOne({
  collection: collectionSlug,
  data,
  draft,
  id,
  locale,
  req,
  where: whereArg,
}) {
  const db = req.transactionID ? this.sessions[req.transactionID] : this.db;
  const collection = this.payload.collections[collectionSlug].config;
  const tableName = toSnakeCase(collection);
  const whereToUse = whereArg || { id: { equals: id } };

  const { where } = await buildQuery({
    adapter: this,
    fields: collection.fields,
    locale,
    tableName,
    where: whereToUse
  });

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.fields,
    id,
    operation: 'update',
    tableName: toSnakeCase(collectionSlug),
    where,
  });

  return result;
};
