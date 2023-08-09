import { ArrayField, Block } from 'payload/types';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import { SanitizedConfig } from 'payload/config';
import { DBQueryConfig } from 'drizzle-orm';
import { traverseFields } from './traverseFields';
import { buildWithFromDepth } from './buildWithFromDepth';
import { createLocaleWhereQuery } from './createLocaleWhereQuery';
import { hasLocalesTable } from '../utilities/hasLocalesTable';

type BuildFindQueryArgs = {
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
  config,
  collection,
  depth,
  fallbackLocale,
  locale,
}: BuildFindQueryArgs): Record<string, unknown> => {
  // In the future, we should remove hasLocalesTable here and just check for
  // the presence of the `${collectionSlug}_locales` table on the `db` -
  // that will be small perf enhancement
  const _locales = config.localization ? {
    where: createLocaleWhereQuery({ fallbackLocale, locale: locale || config.localization.defaultLocale }),
    columns: {
      id: false,
      _parentID: false,
    },
  } : undefined;

  const result: Result = {
    with: {
      _relationships: {
        orderBy: ({ order }, { asc }) => [asc(order)],
        columns: {
          id: false,
          parent: false,
        },
        with: buildWithFromDepth({ config, depth, fallbackLocale, locale }),
      },
    },
  };

  if (_locales && hasLocalesTable(collection.fields)) result.with._locales = _locales;

  const locatedBlocks: Block[] = [];
  const locatedArrays: { [path: string]: ArrayField } = {};

  traverseFields({
    config,
    currentArgs: result,
    depth,
    fields: collection.fields,
    _locales,
    locatedArrays,
    locatedBlocks,
    path: '',
    topLevelArgs: result,
  });

  return result;
};
