import toSnakeCase from 'to-snake-case';
import type { FindOne } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform';

export const findOne: FindOne = async function findOne({
  collection,
  where,
  locale,
  req = {} as PayloadRequest,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);

  const query = await buildQuery({
    collectionSlug: collection,
    adapter: this,
    locale,
    where,
  });

  const findManyArgs = buildFindManyArgs({
    config: this.payload.config,
    collection: collectionConfig,
    depth: 0,
    fallbackLocale: req.fallbackLocale,
    locale: req.locale,
  });

  findManyArgs.where = query;

  const doc = await this.db.query[tableName].findFirst(findManyArgs);

  const result = transform({
    config: this.payload.config,
    fallbackLocale: req.fallbackLocale,
    locale: req.locale,
    data: doc,
    fields: collectionConfig.fields,
  });

  return result;
};
