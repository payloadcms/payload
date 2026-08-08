import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCachedArchivePosts } from '@/blocks/ArchiveBlock/getPosts'
import { postsArchiveTag } from '@/cacheTags'
import { revalidateDelete, revalidatePost } from '@/collections/Posts/hooks/revalidatePost'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayload: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstableCache: vi.fn((callback) => callback),
}))

vi.mock('@payload-config', () => ({
  default: Promise.resolve({}),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  unstable_cache: mocks.unstableCache,
}))

vi.mock('payload', () => ({
  getPayload: mocks.getPayload,
}))

type AfterChangeArgs = Parameters<typeof revalidatePost>[0]
type AfterDeleteArgs = Parameters<typeof revalidateDelete>[0]

const createAfterChangeArgs = ({
  currentStatus,
  previousStatus,
}: {
  currentStatus: 'draft' | 'published'
  previousStatus: 'draft' | 'published'
}) =>
  ({
    doc: { _status: currentStatus, slug: 'hello-world' },
    previousDoc: { _status: previousStatus, slug: 'hello-world' },
    req: {
      context: {},
      payload: {
        logger: {
          info: vi.fn(),
        },
      },
    },
  }) as unknown as AfterChangeArgs

describe('Archive Block cache', () => {
  beforeEach(() => {
    mocks.find.mockReset()
    mocks.getPayload.mockReset()
    mocks.revalidatePath.mockReset()
    mocks.revalidateTag.mockReset()

    mocks.getPayload.mockResolvedValue({ find: mocks.find })
    mocks.find.mockResolvedValue({ docs: [{ id: 'post-1' }] })
  })

  it('should cache archive queries under the shared posts tag', () => {
    expect(mocks.unstableCache).toHaveBeenCalledWith(expect.any(Function), ['archive-posts'], {
      tags: [postsArchiveTag],
    })
  })

  it('should query only public posts with normalized category IDs', async () => {
    const posts = await getCachedArchivePosts({
      categoryIDs: ['category-2', 'category-1'],
      limit: 5,
    })

    expect(mocks.find).toHaveBeenCalledWith({
      collection: 'posts',
      depth: 1,
      limit: 5,
      overrideAccess: false,
      where: {
        categories: {
          in: ['category-1', 'category-2'],
        },
      },
    })
    expect(posts).toEqual([{ id: 'post-1' }])
  })

  it('should omit the category filter when no categories are selected', async () => {
    await getCachedArchivePosts({ categoryIDs: [], limit: 3 })

    expect(mocks.find).toHaveBeenCalledWith({
      collection: 'posts',
      depth: 1,
      limit: 3,
      overrideAccess: false,
    })
  })

  it('should revalidate archive queries when a post is published', async () => {
    await revalidatePost(
      createAfterChangeArgs({ currentStatus: 'published', previousStatus: 'draft' }),
    )

    expect(mocks.revalidateTag).toHaveBeenCalledWith(postsArchiveTag, 'max')
  })

  it('should revalidate archive queries when a post is unpublished', async () => {
    await revalidatePost(
      createAfterChangeArgs({ currentStatus: 'draft', previousStatus: 'published' }),
    )

    expect(mocks.revalidateTag).toHaveBeenCalledWith(postsArchiveTag, 'max')
  })

  it('should not revalidate archive queries for unpublished draft changes', async () => {
    await revalidatePost(createAfterChangeArgs({ currentStatus: 'draft', previousStatus: 'draft' }))

    expect(mocks.revalidateTag).not.toHaveBeenCalledWith(postsArchiveTag, 'max')
  })

  it('should revalidate archive queries when a post is deleted', async () => {
    await revalidateDelete({
      doc: { slug: 'hello-world' },
      req: { context: {} },
    } as unknown as AfterDeleteArgs)

    expect(mocks.revalidateTag).toHaveBeenCalledWith(postsArchiveTag, 'max')
  })
})
