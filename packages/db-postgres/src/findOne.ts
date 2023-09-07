import toSnakeCase from 'to-snake-case';
import type { FindOne } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';

export const findOne: FindOne = async function findOne({
  collection,
  where: incomingWhere,
  locale,
  req = {} as PayloadRequest,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);

  const { where } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    tableName,
    locale,
    where: incomingWhere,
  });

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  });

  findManyArgs.where = where;

  const doc = await this.db.query[tableName].findFirst(findManyArgs);

  return transform({
    config: this.payload.config,
    data: doc,
    fields: collectionConfig.fields,
  });
};
