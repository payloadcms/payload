import toSnakeCase from 'to-snake-case';
import type { FindOne } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';

export const findOne: FindOne = async function findOne({
  collection,
  where,
  locale,
  req = {} as PayloadRequest,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);
  const table = this.tables[tableName];

  const query = await buildQuery({
    collectionSlug: collection,
    adapter: this,
    locale,
    where,
  });

  const [doc] = await this.db.select()
    .from(table)
    .where(query)
    .limit(1);

  return doc;
};
