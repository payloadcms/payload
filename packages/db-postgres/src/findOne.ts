import toSnakeCase from 'to-snake-case';
import type { FindOne } from '@alessiogr/payloadtest/database';
import type { PayloadRequest } from '@alessiogr/payloadtest/types';
import type { SanitizedCollectionConfig } from '@alessiogr/payloadtest/types';
import buildQuery from './queries/buildQuery.js';
import { buildFindManyArgs } from './find/buildFindManyArgs.js';
import { transform } from './transform/read/index.js';

// @ts-ignore // TODO: Fix this
export const findOne: FindOne = async function findOne({
  collection,
  where,
  locale,
  req = {} as PayloadRequest,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    locale,
    where,
  });

  const findManyArgs = buildFindManyArgs({
    adapter: this,
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
