import { expect, it, vi } from 'vitest'

import { CollectionQueryWidget } from './index.js'

vi.mock('../WidgetCard/index.js', () => ({ WidgetCard: () => null, WidgetList: () => null }))

function getArgs({
  isPreview = true,
  canRead = true,
}: { isPreview?: boolean; canRead?: boolean } = {}) {
  const collection = {
    slug: 'posts',
    admin: { useAsTitle: 'title' },
    labels: { plural: 'Posts' },
    fields: [],
  }
  const find = vi.fn().mockResolvedValue({ docs: [] })
  const user = { id: 'user-1' }
  const req = {
    user,
    i18n: { language: 'en', t: (key: string) => key },
    payload: {
      config: {
        collections: [{ ...collection, slug: 'private' }, collection],
        globals: [],
        routes: { admin: '/admin', api: '/api' },
      },
      collections: { posts: { config: collection } },
      find,
      logger: { error: vi.fn() },
    },
  }

  return {
    find,
    user,
    props: {
      isPreview,
      permissions: { collections: { private: { read: false }, posts: { read: canRead } } },
      req,
      widgetSlug: 'collection-query',
    } as unknown as Parameters<typeof CollectionQueryWidget>[0],
  }
}

it('should preview an unconfigured collection query using a readable collection and a small result limit', async () => {
  const { find, props, user } = getArgs()

  await CollectionQueryWidget(props)
  expect(find).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ collection: 'posts', limit: 3, overrideAccess: false, user }),
  )
})

it('should not infer a collection or run a query for an unconfigured real widget', async () => {
  const { find, props } = getArgs({ isPreview: false })

  await CollectionQueryWidget(props)
  expect(find).not.toHaveBeenCalled()
})

it('should leave the preview empty when no collection is readable', async () => {
  const { find, props } = getArgs({ canRead: false })

  expect(await CollectionQueryWidget(props)).toBeNull()
  expect(find).not.toHaveBeenCalled()
})
