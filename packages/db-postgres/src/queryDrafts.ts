import { sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';
import type { QueryDrafts } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { buildVersionCollectionFields } from 'payload/dist/versions/buildCollectionFields';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';

export const queryDrafts: QueryDrafts = async function queryDrafts({
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
  const versionsTableName = `_${tableName}_versions`;
  const table = this.tables[versionsTableName];
  const limit = typeof limitArg === 'number' ? limitArg : collectionConfig.admin.pagination.defaultLimit;
  // TODO: use sort
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort;

  let totalDocs;
  let totalPages;
  let hasPrevPage;
  let hasNextPage;
  let pagingCounter;

  const query = await buildQuery({
    collectionSlug: collection,
    versionsFields: buildVersionCollectionFields(collectionConfig),
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
    docs, // : T[]
    totalDocs, // : number
    limit, // : number
    totalPages, // : number
    page, // ?: number
    pagingCounter, // : number
    hasPrevPage, // : boolean
    hasNextPage, // : boolean
    prevPage: hasPrevPage ? page - 1 : null, // ?: number | null | undefined
    nextPage: hasNextPage ? page + 1 : null, // ?: number | null | undefined
  };
};
