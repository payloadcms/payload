import { expect, test, vi } from 'vitest'

import { RenderDiff } from '../Version/RenderFieldsToDiff/index.js'
import { renderMergeDiffHandler } from './renderMergeDiff.js'

vi.mock('../../utilities/getClientConfig.js', () => ({ getClientConfig: () => ({}) }))
vi.mock('../../utilities/getClientSchemaMap.js', () => ({ getClientSchemaMap: () => ({}) }))
vi.mock('../../utilities/getSchemaMap.js', () => ({ getSchemaMap: () => ({}) }))
vi.mock('../Version/RenderFieldsToDiff/index.js', () => ({ RenderDiff: vi.fn(() => 'diff') }))

const createRequest = ({
  afterVersion,
  beforeVersion,
  change,
}: {
  afterVersion?: Record<string, unknown>
  beforeVersion?: Record<string, unknown>
  change: Record<string, unknown>
}) => {
  const findVersionByID = vi.fn(async ({ id }: { id: string }) => {
    const version = id === 'before-version' ? beforeVersion : afterVersion

    if (!version) {
      throw new Error('Version not found')
    }

    return { id, version }
  })

  return {
    findVersionByID,
    req: {
      i18n: { t: (key: string) => key },
      payload: {
        collections: {
          posts: {
            config: { fields: [{ name: 'title', type: 'text' }], slug: 'posts' },
          },
        },
        config: { globals: [] },
        findByID: vi.fn(async () => ({ changes: [change] })),
        findVersionByID,
        importMap: {},
      },
      user: { collection: 'users', id: 'user-id' },
    },
  }
}

test('should render a merge diff from access-checked target versions', async () => {
  const { findVersionByID, req } = createRequest({
    afterVersion: { title: 'After' },
    beforeVersion: { title: 'Before' },
    change: {
      afterVersionID: 'after-version',
      beforeVersionID: 'before-version',
      collectionSlug: 'posts',
      operation: 'update',
    },
  })

  const result = await renderMergeDiffHandler({
    changeIndex: 0,
    mergeID: 'merge-id',
    req,
  } as never)

  expect(result).toMatchObject({ status: 'ready' })
  expect(findVersionByID).toHaveBeenCalledTimes(2)
  expect(findVersionByID).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'posts',
      id: 'before-version',
      overrideAccess: false,
      user: req.user,
    }),
  )
  expect(RenderDiff).toHaveBeenCalledWith(
    expect.objectContaining({
      versionFromSiblingData: { title: 'Before' },
      versionToSiblingData: { title: 'After' },
    }),
  )
})

test('should report an unavailable merge diff when a referenced version is missing', async () => {
  const { req } = createRequest({
    afterVersion: { title: 'After' },
    change: {
      afterVersionID: 'after-version',
      beforeVersionID: 'before-version',
      collectionSlug: 'posts',
      operation: 'update',
    },
  })

  const result = await renderMergeDiffHandler({
    changeIndex: 0,
    mergeID: 'merge-id',
    req,
  } as never)

  expect(result).toEqual({ status: 'unavailable' })
})

test('should report an unavailable merge diff when target versioning was disabled', async () => {
  const { findVersionByID, req } = createRequest({
    change: { collectionSlug: 'posts', operation: 'update' },
  })

  const result = await renderMergeDiffHandler({
    changeIndex: 0,
    mergeID: 'merge-id',
    req,
  } as never)

  expect(result).toEqual({ status: 'unavailable' })
  expect(findVersionByID).not.toHaveBeenCalled()
})
