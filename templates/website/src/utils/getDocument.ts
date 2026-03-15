import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'

type Collection = keyof Config['collections']

const getDocument = async (collection: Collection, slug: string, depth = 0) => {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = async (collection: Collection, slug: string) =>
  unstable_cache(async () => await getDocument(collection, slug), [collection, slug], {
    tags: [`${collection}_${slug}`],
  })
