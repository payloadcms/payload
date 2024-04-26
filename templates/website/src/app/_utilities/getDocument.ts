import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, id: string, depth = 0) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.findByID({
    id,
    collection,
    depth,
  })
  return page
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (collection: Collection, id: string) =>
  unstable_cache(async () => getDocument(collection, id), [collection, id])
