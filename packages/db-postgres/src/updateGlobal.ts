import { PayloadRequest } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { UpdateGlobal } from 'payload/dist/database/types';
import { upsertRow } from './upsertRow';
import { PostgresAdapter } from './types';

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: PostgresAdapter,
  { data, slug, req = {} as PayloadRequest },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug);
  const tableName = toSnakeCase(slug);

  const existingGlobal = await this.db.query[tableName].findFirst({});

  const result = await upsertRow({
    adapter: this,
    data,
    fields: globalConfig.fields,
    locale: req.locale,
    operation: 'update',
    id: existingGlobal.id,
    tableName: toSnakeCase(slug),
  });

  return result;
};
