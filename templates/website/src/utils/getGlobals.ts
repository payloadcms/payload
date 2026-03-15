import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'

type Global = keyof Config['globals']

const getGlobal = async (slug: Global, depth = 0) => {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = async (slug: Global, depth = 0) =>
  unstable_cache(async () => await getGlobal(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
