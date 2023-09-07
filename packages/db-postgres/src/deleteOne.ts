import { DeleteOne } from 'payload/dist/database/types';
import { PayloadRequest } from 'payload/dist/express/types';
import toSnakeCase from 'to-snake-case';
import { PostgresAdapter } from './types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';

export const deleteOne: DeleteOne = async function deleteOne(
  this: PostgresAdapter,
  {
    collection,
    where: incomingWhere,
    req = {} as PayloadRequest,
  },
) {
  const collectionConfig = this.payload.collections[collection].config;
  const tableName = toSnakeCase(collection);

  const { where } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    tableName,
    where: incomingWhere,
  });

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  });

  findManyArgs.where = where;

  const docToDelete = await this.db.query[tableName].findFirst(findManyArgs);

  const result = transform({
    config: this.payload.config,
    data: docToDelete,
    fields: collectionConfig.fields,
  });

  await this.db.delete(this.tables[tableName])
    .where(where);

  return result;
};
