import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { TypedLocale } from 'payload'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(slug: T, depth = 0, locale: TypedLocale): Promise<DataFromGlobalSlug<T>> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug and locale
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0, locale: TypedLocale) =>
  unstable_cache(async () => getGlobal<T>(slug, depth, locale), [slug, locale], {
    tags: [`global_${slug}`],
  })
