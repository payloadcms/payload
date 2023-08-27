import toSnakeCase from 'to-snake-case';
import type { FindGlobal } from 'payload/dist/database/types';
import buildQuery from './queries/buildQuery';
import { buildFindManyArgs } from './find/buildFindManyArgs';
import { transform } from './transform/read';
import { PostgresAdapter } from './types';

export const findGlobal: FindGlobal = async function findGlobal(
  this: PostgresAdapter,
  { slug, locale, where },
) {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug);
  const tableName = toSnakeCase(slug);

  const query = await buildQuery({
    adapter: this,
    globalSlug: slug,
    locale,
    where,
  });

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: globalConfig.fields,
    tableName,
  });

  findManyArgs.where = query;

  const doc = await this.db.query[tableName].findFirst(findManyArgs);

  if (doc) {
    const result = transform({
      config: this.payload.config,
      data: doc,
      fields: globalConfig.fields,
    });

    return result;
  }

  return null;
};
