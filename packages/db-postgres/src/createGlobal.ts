import { PayloadRequest } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { CreateGlobal } from 'payload/dist/database/types';
import { upsertRow } from './upsertRow';
import { PostgresAdapter } from './types';

export const createGlobal: CreateGlobal = async function createGlobal(
  this: PostgresAdapter,
  { data, slug, req = {} as PayloadRequest },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug);

  const result = await upsertRow({
    adapter: this,
    data,
    fields: globalConfig.fields,
    locale: req.locale,
    operation: 'create',
    tableName: toSnakeCase(slug),
  });

  return result;
};
