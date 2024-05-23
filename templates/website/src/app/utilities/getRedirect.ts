import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { unstable_cache } from 'next/cache'

export async function getRedirect(slug: string, depth = 1) {
  const payload = await getPayloadHMR({ config: configPromise })

  const { docs: redirects } = await payload.find({
    collection: 'redirects',
    depth,
    limit: 1,
    pagination: false,
    where: {
      from: {
        equals: slug,
      },
    },
  })
  return redirects[0]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedRedirect = (slug: string) =>
  unstable_cache(async () => getRedirect(slug), [slug], {
    tags: [`redirects_${slug}`],
  })
