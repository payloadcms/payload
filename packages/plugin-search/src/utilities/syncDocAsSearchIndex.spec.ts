import { describe, expect, it, vi } from 'vitest'

import { syncDocAsSearchIndex } from './syncDocAsSearchIndex.js'

const syncUpdatedPage = async (existingPriority: null | number) => {
  const update = vi.fn()

  await syncDocAsSearchIndex({
    collection: 'pages',
    doc: { id: 'page-1', _status: 'published', title: 'Page' },
    operation: 'update',
    pluginConfig: { defaultPriorities: { pages: 10 } },
    req: {
      context: {},
      payload: {
        config: {},
        find: vi.fn().mockResolvedValue({
          docs: [{ id: 'search-1', priority: existingPriority }],
        }),
        logger: { error: vi.fn() },
        update,
      },
    },
  } as never)

  return update.mock.calls[0]?.[0]?.data?.priority
}

describe('syncDocAsSearchIndex', () => {
  it('should keep a priority of 0 on the existing search document', async () => {
    expect(await syncUpdatedPage(0)).toBe(0)
  })

  it('should keep a non-zero priority on the existing search document', async () => {
    expect(await syncUpdatedPage(5)).toBe(5)
  })

  it('should fall back to the default priority when the search document has none', async () => {
    expect(await syncUpdatedPage(null)).toBe(10)
  })
})
