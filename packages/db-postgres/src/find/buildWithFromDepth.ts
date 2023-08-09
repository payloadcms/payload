/* eslint-disable no-param-reassign */
import { SanitizedConfig } from 'payload/config';
import { buildFindManyArgs } from './buildFindManyArgs';
import { PostgresAdapter } from '../types';

type BuildWithFromDepthArgs = {
  adapter: PostgresAdapter
  config: SanitizedConfig
  depth: number
  fallbackLocale?: string | false
  locale?: string
}

export const buildWithFromDepth = ({
  adapter,
  config,
  depth,
  fallbackLocale,
  locale,
}: BuildWithFromDepthArgs): Record<string, unknown> | undefined => {
  const result = config.collections.reduce((slugs, coll) => {
    const { slug } = coll;

    if (depth >= 1) {
      const args = buildFindManyArgs({
        adapter,
        config,
        collection: coll,
        depth: depth - 1,
        fallbackLocale,
        locale,
      });

      slugs[`${slug}ID`] = args;
    }

    return slugs;
  }, {});

  return result;
};
