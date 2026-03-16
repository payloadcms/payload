import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const getRedirects = async (depth = 1) => {
  const payload = await getPayload({ config: configPromise })

  const { docs: redirects } = await payload.find({
    collection: 'redirects',
    depth,
    limit: 0,
    pagination: false,
  })

  return redirects
}

/**
 * Returns a unstable_cache function mapped with the cache tag for 'redirects'.
 *
 * Cache all redirects together to avoid multiple fetches.
 */
export const getCachedRedirects = async () =>
  unstable_cache(async () => await getRedirects(), ['redirects'], {
    tags: ['redirects'],
  })
