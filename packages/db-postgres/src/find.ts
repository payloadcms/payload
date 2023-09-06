import { asc, desc, inArray, sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';
import type { Find } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';
import { GenericColumn, PostgresAdapter } from './types';

export const find: Find = async function find(
  this: PostgresAdapter, {
    collection,
    where: incomingWhere,
    page = 1,
    limit: limitArg,
    sort: sortArg,
    locale,
    pagination,
    req = {} as PayloadRequest,
  },
) {
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

  const {
    where,
    orderBy,
    joins,
  } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    locale,
    where: incomingWhere,
    sort,
    tableName,
  });

  const orderedIDMap: Record<number | string, number> = {};

  const selectFields: Record<string, GenericColumn> = {
    id: table.id,
  };
  if (orderBy) {
    selectFields.sort = orderBy.column;
  }

  // initial query
  const selectQuery = this.db.selectDistinct(selectFields)
    .from(table);
  if (orderBy.order && orderBy.column) {
    selectQuery.orderBy(orderBy.order(orderBy.column));
  }

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  });

  // only fetch IDs when a sort or where query is used that needs to be done on join tables, otherwise these can be done directly on the table in findMany
  if (Object.keys(joins).length > 0) {
    if (where) {
      selectQuery.where(where);
    }
    Object.entries(joins)
      .forEach(([joinTable, condition]) => {
        selectQuery.leftJoin(this.tables[joinTable], condition);
      });
    const result = await selectQuery
      .offset((page - 1) * limit)
      .limit(limit === 0 ? undefined : limit);
    // set the id in an object for sorting later
    result.forEach(({ id }, i) => {
      orderedIDMap[id as (number | string)] = i;
    });
    findManyArgs.where = inArray(this.tables[tableName].id, Object.keys(orderedIDMap));
  } else {
    findManyArgs.where = where;
    // orderBy will only be set if a complex sort is needed on a relation
    if (sort) {
      if (sort[0] === '-') {
        findManyArgs.orderBy = desc(this.tables[tableName][sort.substring(1)]);
      } else {
        findManyArgs.orderBy = asc(this.tables[tableName][sort]);
      }
    }
  }

  if (pagination !== false) {
    // use query above, optionally we don't need the sort
    const countResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(table)
      .where(where);
    totalDocs = Number(countResult[0].count);
    totalPages = Math.ceil(totalDocs / limit);
    hasPrevPage = page > 1;
    hasNextPage = totalPages > page;
    pagingCounter = ((page - 1) * limit) + 1;
    findManyArgs.limit = limit === 0 ? undefined : limit;
    findManyArgs.offset = (page - 1) * limit;
  }

  const rawDocs = await this.db.query[tableName].findMany(findManyArgs);

  // sort rawDocs from selectQuery
  if (Object.keys(orderedIDMap).length > 0) {
    rawDocs.sort((a, b) => (orderedIDMap[a.id] - orderedIDMap[b.id]));
  }

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
