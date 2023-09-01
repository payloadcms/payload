import type { Find } from 'payload/database';
import type { SanitizedCollectionConfig } from 'payload/types';
import type { PayloadRequest } from 'payload/types';

import { sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';

import buildQuery from './queries/buildQuery';

export const find: Find = async function find({
  collection,
  limit: limitArg,
  locale,
  page = 1,
  pagination,
  req = {} as PayloadRequest,
  sort: sortArg,
  where,
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
    adapter: this,
    collectionSlug: collection,
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
    hasNextPage, // : boolean
    hasPrevPage, // : boolean
    limit, // : number
    nextPage: hasNextPage ? page + 1 : null, // ?: number | null | undefined
    page, // ?: number
    pagingCounter, // : number
    prevPage: hasPrevPage ? page - 1 : null, // ?: number | null | undefined
    totalDocs, // : number
    totalPages, // : number
  };
};
