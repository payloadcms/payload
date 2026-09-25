import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessResults } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
import { getDocumentWidgetData } from './getDocumentWidgetData.js'

vi.mock('payload', () => ({ getAccessResults: vi.fn() }))
const posts = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  fields: [],
  flattenedFields: [],
  labels: { plural: { en: 'Posts' } },
  versions: { drafts: {} },
} as SanitizedCollectionConfig
const user = { id: 'user-1', collection: 'users' }
let req: PayloadRequest
let find: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.mocked(getAccessResults).mockResolvedValue({
    canAccessAdmin: true,
    collections: {
      posts: { read: true },
      hidden: { read: true },
      excluded: { read: true },
      forbidden: { read: false },
    },
  } as Awaited<ReturnType<typeof getAccessResults>>)
  find = vi.fn().mockImplementation(({ collection, draft, where }) => {
    if (collection === 'payload-preferences') {
      return {
        docs: [
          {
            key: PREFERENCE_KEYS.DASHBOARD_DOCUMENTS,
            value: {
              pins: [
                { id: 'draft', collectionSlug: 'posts' },
                { id: 'deleted', collectionSlug: 'posts' },
              ],
            },
          },
          {
            key: PREFERENCE_KEYS.RECENTLY_VIEWED,
            value: {
              items: [
                { id: 'changed', collectionSlug: 'posts' },
                { id: 'missing', collectionSlug: 'posts' },
                { id: 'deleted', collectionSlug: 'posts' },
              ],
            },
          },
        ],
      }
    }
    if (draft === false) {
      return { docs: [{ id: 'changed' }] }
    }
    if (where._status) {
      return {
        docs: [
          { id: 'draft', title: 'New draft', _status: 'draft' },
          { id: 'changed', title: 'Changed draft', _status: 'draft' },
        ],
      }
    }
    return {
      docs: [
        { id: 'changed', title: 'Changed draft', _status: 'draft' },
        { id: 'deleted', title: 'Deleted', deletedAt: '2026-09-01' },
      ],
    }
  })
  req = {
    user,
    i18n: { language: 'en', t: (key) => key },
    payload: {
      find,
      logger: { error: vi.fn() },
      collections: {},
      config: {
        admin: { dateFormat: 'yyyy-MM-dd' },
        routes: { admin: '/custom-admin' },
        globals: [],
        collections: [
          posts,
          { ...posts, slug: 'hidden', admin: { hidden: () => true } },
          { ...posts, slug: 'excluded' },
          { ...posts, slug: 'forbidden' },
        ],
      },
    },
  } as unknown as PayloadRequest
})

describe('dashboard document loading', () => {
  it('should enforce access control and the current user on every data query', async () => {
    await getDocumentWidgetData({ req, excludedCollections: ['excluded'] })
    for (const [args] of find.mock.calls) {
      expect(args).toMatchObject({ overrideAccess: false, user, req })
    }
    expect(new Set(find.mock.calls.map(([args]) => args.collection))).toEqual(
      new Set(['payload-preferences', 'posts']),
    )
  })
  it('should omit deleted and inaccessible saved documents without discarding pins', async () => {
    const result = await getDocumentWidgetData({ req, excludedCollections: ['excluded'] })
    expect(result.recentKeys).toEqual(['posts:changed'])
    expect(result.documents.map(({ id }) => id)).toEqual(['changed', 'draft'])
    expect(result.preferences.pins).toHaveLength(2)
  })
  it('should distinguish unpublished drafts from changes to published documents', async () => {
    const result = await getDocumentWidgetData({ req, excludedCollections: ['excluded'] })
    expect(result.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'changed',
          status: 'changed',
          title: 'Changed draft',
          href: '/custom-admin/collections/posts/changed',
        }),
        expect.objectContaining({ id: 'draft', status: 'draft', title: 'New draft' }),
      ]),
    )
    expect(result.documents.every((doc) => doc.updatedBy === undefined)).toBe(true)
  })
  it('should return an error state instead of failing the dashboard when a collection query fails', async () => {
    find.mockImplementation(({ collection }) => {
      if (collection === 'payload-preferences') {
        return { docs: [] }
      }
      throw new Error('Database unavailable')
    })
    const result = await getDocumentWidgetData({ req, excludedCollections: ['excluded'] })
    expect(result.hasError).toBe(true)
    expect(result.documents).toEqual([])
  })
  it('should return an error state when preferences cannot be loaded', async () => {
    find.mockRejectedValue(new Error('Preferences unavailable'))
    const result = await getDocumentWidgetData({ req })
    expect(result.hasError).toBe(true)
    expect(result.documents).toEqual([])
  })
  it('should not load documents for an unauthenticated request', async () => {
    const result = await getDocumentWidgetData({ req: { ...req, user: null } })
    expect(result.documents).toEqual([])
    expect(find).not.toHaveBeenCalled()
  })
  it('should not load collection documents when admin access is denied', async () => {
    vi.mocked(getAccessResults).mockResolvedValue({ canAccessAdmin: false } as Awaited<
      ReturnType<typeof getAccessResults>
    >)
    expect((await getDocumentWidgetData({ req })).documents).toEqual([])
    expect(find).toHaveBeenCalledTimes(1)
  })
})
