import { DeleteMany } from 'payload/dist/database/types';
import { PayloadRequest } from 'payload/dist/express/types';
import toSnakeCase from 'to-snake-case';
import { PostgresAdapter } from './types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';

export const deleteMany: DeleteMany = async function deleteMany(this: PostgresAdapter,
  { collection, where, req = {} as PayloadRequest }) {
  const collectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    where,
  });

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  });

  findManyArgs.where = query;

  const docsToDelete = await this.db.query[tableName].findMany(findManyArgs);

  const result = docsToDelete.map((data) => {
    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    });
  });

  await this.db.delete(this.tables[tableName]).where(query);

  return result;
};
