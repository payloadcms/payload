import toSnakeCase from 'to-snake-case';
import type { Find } from 'payload/dist/database/types';
import { PayloadRequest } from 'payload/dist/express/types';
import buildQuery from './queries/buildQuery';

export const find: Find = async function find({
  collection,
  where,
  page,
  limit,
  sort: sortArg,
  locale,
  pagination,
  req = {} as PayloadRequest,
}) {
  const collectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);
  const table = this.tables[tableName];

  const query = await buildQuery({
    collectionSlug: collection,
    adapter: this,
    locale,
    where,
  });

  console.log(query);

  const result = await this.db.select().from(table).where(query);

  return result;
  //
  //
  // return {
  //   ...result,
  //   docs: docs.map((doc) => {
  //     // eslint-disable-next-line no-param-reassign
  //     doc.id = doc._id;
  //     return sanitizeInternalFields(doc);
  //   }),
  // };
};
