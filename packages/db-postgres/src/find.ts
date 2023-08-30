import { sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';
import type { Find } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';

export const find: Find = async function find({
  collection,
  where,
  page = 1,
  limit: limitArg,
  sort: sortArg,
  locale,
  pagination,
  req = {} as PayloadRequest,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);
  const table = this.tables[tableName];
  const limit = typeof limitArg === 'number' ? limitArg : collectionConfig.admin.pagination.defaultLimit;
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort;
  let totalDocs: number;
  let totalPages: number;
  let hasPrevPage: boolean;
  let hasNextPage: boolean;
  let pagingCounter: number;

  const query = await buildQuery({
    collectionSlug: collection,
    adapter: this,
    locale,
    where,
  });

  if (pagination !== false) {
    const countResult = await this.db.select({ count: sql<number>`count(*)` }).from(table).where(query);
    totalDocs = Number(countResult[0].count);
    totalPages = Math.ceil(totalDocs / limit);
    hasPrevPage = page > 1;
    hasNextPage = totalPages > page;
    pagingCounter = ((page - 1) * limit) + 1;
  }

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
    sort,
  });

  findManyArgs.limit = limit === 0 ? undefined : limit;
  findManyArgs.offset = (page - 1) * limit;
  findManyArgs.where = query;

  const rawDocs = await this.db.query[tableName].findMany(findManyArgs);

  const docs = rawDocs.map((data) => {
    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    });
  });

  return {
    docs,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter,
    hasPrevPage,
    hasNextPage,
    prevPage: hasPrevPage ? page - 1 : null,
    nextPage: hasNextPage ? page + 1 : null,
  };
};
