import type { Category } from '@/payload-types'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { postsArchiveTag } from '@/cacheTags'

type Args = {
  categoryIDs?: Category['id'][]
  limit: number
}

const queryArchivePosts = unstable_cache(
  async ({ categoryIDs, limit }: Args) => {
    const payload = await getPayload({ config: configPromise })

    const posts = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      overrideAccess: false,
      ...(categoryIDs && categoryIDs.length > 0
        ? {
            where: {
              categories: {
                in: categoryIDs,
              },
            },
          }
        : {}),
    })

    return posts.docs
  },
  ['archive-posts'],
  {
    tags: [postsArchiveTag],
  },
)

export const getCachedArchivePosts = ({ categoryIDs, limit }: Args) => {
  const normalizedCategoryIDs = categoryIDs?.length ? [...categoryIDs].sort() : undefined

  return queryArchivePosts({
    categoryIDs: normalizedCategoryIDs,
    limit,
  })
}
