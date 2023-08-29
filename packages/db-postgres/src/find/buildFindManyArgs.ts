import { ArrayField, Block } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { SanitizedCollectionConfig } from 'payload/types';
import { SanitizedConfig } from 'payload/config';
import { DBQueryConfig } from 'drizzle-orm';
import { traverseFields } from './traverseFields.js';
import { buildWithFromDepth } from './buildWithFromDepth.js';
import { createLocaleWhereQuery } from './createLocaleWhereQuery.js';
import { PostgresAdapter } from '../types.js';

type BuildFindQueryArgs = {
  adapter: PostgresAdapter
  config: SanitizedConfig
  collection: SanitizedCollectionConfig
  depth: number
  fallbackLocale?: string | false
  locale?: string
}

export type Result = DBQueryConfig<'many', true, any, any>

// Generate the Drizzle query for findMany based on
// a collection field structure
export const buildFindManyArgs = ({
  adapter,
  config,
  collection,
  depth,
  fallbackLocale,
  locale,
}: BuildFindQueryArgs): Record<string, unknown> => {
  const result: Result = {
    with: {},
  };

  const _locales: Result = {
    where: createLocaleWhereQuery({ fallbackLocale, locale }),
    columns: {
      id: false,
      _parentID: false,
    },
  };

  const tableName = toSnakeCase(collection.slug);

  if (adapter.tables[`${tableName}_relationships`]) {
    result.with._relationships = {
      orderBy: ({ order }, { asc }) => [asc(order)],
      columns: {
        id: false,
        parent: false,
      },
      with: buildWithFromDepth({
        adapter,
        config,
        depth,
        fallbackLocale,
        locale,
      }),
    };
  }

  if (adapter.tables[`${tableName}_locales`]) {
    result.with._locales = _locales;
  }

  const locatedBlocks: Block[] = [];
  const locatedArrays: { [path: string]: ArrayField } = {};

  traverseFields({
    adapter,
    config,
    currentArgs: result,
    currentTableName: tableName,
    depth,
    fields: collection.fields,
    _locales,
    locatedArrays,
    locatedBlocks,
    path: '',
    topLevelArgs: result,
    topLevelTableName: tableName,
  });

  return result;
};
