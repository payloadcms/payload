/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'

import type { PostgresAdapter } from '../types.js'

import { buildFindManyArgs } from './buildFindManyArgs.js'

type BuildWithFromDepthArgs = {
  adapter: PostgresAdapter
  config: SanitizedConfig
  depth: number
  fallbackLocale?: false | string
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
    const { slug } = coll

    if (depth >= 1) {
      const args = buildFindManyArgs({
        adapter,
        collection: coll,
        config,
        depth: depth - 1,
        fallbackLocale,
        locale,
      })

      slugs[`${slug}ID`] = args
    }

    return slugs
  }, {})

  return result
}
