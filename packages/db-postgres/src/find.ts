import { sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';
import type { Find } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';

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
  let totalDocs;
  let totalPages;
  let hasPrevPage;
  let hasNextPage;
  let pagingCounter;

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

  const docs = await this.db.select()
    .from(table)
    .limit(limit === 0 ? undefined : limit)
    .offset((page - 1) * limit)
    .where(query);

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
