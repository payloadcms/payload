import { asc, desc, inArray, sql } from 'drizzle-orm';
import toSnakeCase from 'to-snake-case';
import type { Find } from 'payload/dist/database/types';
import type { PayloadRequest } from 'payload/dist/express/types';
import type { SanitizedCollectionConfig, TypeWithID } from 'payload/dist/collections/config/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';
import { PostgresAdapter } from './types';

export const find: Find = async function find(
  this: PostgresAdapter, {
    collection,
    where: whereArg,
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
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort;
  let limit = limitArg;
  let totalDocs: number;
  let totalPages: number;
  let hasPrevPage: boolean;
  let hasNextPage: boolean;
  let pagingCounter: number;
  let selectDistinctResult;

  const {
    where,
    orderBy,
    joins,
    selectFields,
  } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    locale,
    where: whereArg,
    sort,
    tableName,
  });

  const orderedIDMap: Record<number | string, number> = {};

  const selectQuery = this.db.selectDistinct(selectFields)
    .from(table);

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
        if (joinTable) {
          selectQuery.leftJoin(this.tables[joinTable], condition);
        }
      });

    selectDistinctResult = await selectQuery
      .offset((page - 1) * limit)
      .limit(limit === 0 ? undefined : limit);

    if (selectDistinctResult.length === 0) {
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 0,
        page: 1,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      };
    }
    // set the id in an object for sorting later
    selectDistinctResult.forEach(({ id }, i) => {
      orderedIDMap[id as (number | string)] = i;
    });
    const findWhere = Object.keys(orderedIDMap);
    findManyArgs.where = inArray(this.tables[tableName].id, Object.keys(orderedIDMap));
  } else {
    findManyArgs.limit = limitArg === 0 ? undefined : limitArg;
    findManyArgs.offset = (page - 1) * limitArg;
    if (where) {
      findManyArgs.where = where;
    }
    // orderBy will only be set if a complex sort is needed on a relation
    if (sort) {
      if (sort[0] === '-') {
        findManyArgs.orderBy = desc(this.tables[tableName][sort.substring(1)]);
      } else {
        findManyArgs.orderBy = asc(this.tables[tableName][sort]);
      }
    }
  }

  const findPromise = this.db.query[tableName].findMany(findManyArgs);

  if (pagination !== false || selectDistinctResult.length > limit) {
    const selectCount = this.db.select({ count: sql<number>`count(*)` })
      .from(table)
      .where(where);
    Object.entries(joins)
      .forEach(([joinTable, condition]) => {
        if (joinTable) {
          selectCount.leftJoin(this.tables[joinTable], condition);
        }
      });
    const countResult = await selectCount;
    totalDocs = Number(countResult[0].count);
    totalPages = typeof limit === 'number' ? Math.ceil(totalDocs / limit) : 1;
    hasPrevPage = page > 1;
    hasNextPage = totalPages > page;
    pagingCounter = ((page - 1) * limit) + 1;
  }

  const rawDocs = await findPromise;
  // sort rawDocs from selectQuery
  if (Object.keys(orderedIDMap).length > 0) {
    rawDocs.sort((a, b) => (orderedIDMap[a.id] - orderedIDMap[b.id]));
  }

  if (pagination === false) {
    totalDocs = rawDocs.length;
    limit = totalDocs;
    totalPages = 1;
    pagingCounter = 1;
    hasPrevPage = false;
    hasNextPage = false;
  }

  const docs = rawDocs.map((data: TypeWithID) => {
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
