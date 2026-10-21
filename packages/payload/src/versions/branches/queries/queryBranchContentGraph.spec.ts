import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { queryBranchContent } from './queryBranchContent.js'
import { queryBranchContentGraph } from './queryBranchContentGraph.js'

vi.mock('./queryBranchContent.js', () => ({ queryBranchContent: vi.fn() }))

const makeRequest = () =>
  ({
    locale: 'all',
    payload: {
      config: { maxDepth: 10, blocks: [] },
      blocks: {
        panel: { slug: 'panel', fields: [{ name: 'asset', type: 'upload', relationTo: 'media' }] },
      },
      collections: {
        roots: {
          config: {
            fields: [
              {
                name: 'related',
                type: 'relationship',
                relationTo: 'targets',
                hasMany: true,
                localized: true,
              },
              {
                type: 'tabs',
                tabs: [
                  {
                    name: 'details',
                    fields: [
                      {
                        name: 'polymorphic',
                        type: 'relationship',
                        relationTo: ['targets', 'media'],
                      },
                    ],
                  },
                ],
              },
              {
                name: 'rows',
                type: 'array',
                fields: [{ name: 'blocks', type: 'blocks', blocks: ['panel'] }],
              },
              { name: 'joined', type: 'join', collection: 'targets', on: 'owner' },
              { name: 'opaque', type: 'json' },
            ],
          },
        },
        targets: {
          config: { fields: [{ name: 'parent', type: 'relationship', relationTo: 'roots' }] },
        },
        media: { config: { fields: [] } },
      },
      db: { branching: { withReadSnapshot: ({ read, req }) => read({ req }) } },
    },
  }) as unknown as PayloadRequest

const page = (docs: Record<string, unknown>[]) =>
  ({ docs, totalDocs: docs.length }) as Awaited<ReturnType<typeof queryBranchContent>>

describe('automatic branch raw graph', () => {
  it('should collect schema forward references, join IDs, cycles and explicit denied negatives before selecting', async () => {
    const root = {
      id: 1,
      related: { en: [1, 2], fr: [3] },
      details: { polymorphic: { relationTo: 'media', value: '1' } },
      rows: [{ id: 'row', blocks: [{ blockType: 'panel', asset: '2' }] }],
      joined: { docs: [4], totalDocs: 1 },
      opaque: { relationTo: 'fake', value: 999 },
    }
    vi.mocked(queryBranchContent).mockImplementation(async (args) => {
      if (args.collection === 'roots') return page([root])
      if (args.collection === 'targets') return page([{ id: 1, parent: 1 }, { id: 3 }, { id: 4 }])
      return page([{ id: '1' }, { id: '2' }])
    })
    const { result, graph } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 2,
      req: makeRequest(),
      select: { details: true },
    })

    expect(result.docs).toEqual([{ id: 1, details: root.details }])
    expect(graph.get({ collection: 'targets', id: 2 })).toBeNull()
    expect(graph.get({ collection: 'targets', id: 3 })).toEqual({ id: 3 })
    expect(graph.get({ collection: 'media', id: '1' })).toEqual({ id: '1' })
    expect(graph.get({ collection: 'media', id: '2' })).toEqual({ id: '2' })
    expect(graph.get({ collection: 'roots', id: 1 })).toEqual(root)
    expect(() => graph.get({ collection: 'fake', id: 999 })).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
    expect(queryBranchContent).toHaveBeenCalledTimes(3)
    expect(vi.mocked(queryBranchContent).mock.calls[0][0].select).toBeUndefined()
  })

  it('should traverse a selected locale and its fallback through localized ancestors without collecting unrelated locales', async () => {
    const req = makeRequest()
    req.locale = 'en'
    req.fallbackLocale = 'fr'
    req.payload.collections.roots.config.fields.push({
      name: 'localizedGroup',
      type: 'group',
      localized: true,
      fields: [{ name: 'target', type: 'relationship', relationTo: 'targets', localized: true }],
    })
    vi.mocked(queryBranchContent)
      .mockClear()
      .mockImplementation(async (args) =>
        args.collection === 'roots'
          ? page([
              {
                id: 1,
                related: { en: null, fr: [2], de: [999] },
                localizedGroup: { en: { target: 3 }, fr: { target: 4 } },
              },
            ])
          : page([{ id: 2 }, { id: 3 }]),
      )
    const { graph } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 1,
      locale: 'en',
      req,
    })
    expect(graph.get({ collection: 'targets', id: 2 })).toEqual({ id: 2 })
    expect(graph.get({ collection: 'targets', id: 3 })).toEqual({ id: 3 })
    expect(() => graph.get({ collection: 'targets', id: 4 })).toThrow()
    expect(() => graph.get({ collection: 'targets', id: 999 })).toThrow()
  })

  it('should collect a valid zero ID selected through a locale fallback', async () => {
    const req = makeRequest()
    req.locale = 'en'
    req.fallbackLocale = 'fr'
    req.payload.collections.roots.config.fields = [
      { name: 'target', type: 'relationship', relationTo: 'targets', localized: true },
    ]
    vi.mocked(queryBranchContent)
      .mockClear()
      .mockImplementation(async (args) =>
        args.collection === 'roots'
          ? page([{ id: 1, target: { en: null, fr: 0 } }])
          : page([{ id: 0 }]),
      )
    const { graph } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 1,
      req,
    })
    expect(graph.get({ collection: 'targets', id: 0 })).toEqual({ id: 0 })
  })

  it('should preserve configured maximum depths and stop when the frontier is exhausted', async () => {
    const req = makeRequest()
    req.payload.config = { maxDepth: 20 } as never
    vi.mocked(queryBranchContent)
      .mockClear()
      .mockResolvedValue(page([{ id: 1 }]))
    const { graph } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 20,
      req,
    })
    expect(graph.get({ collection: 'roots', id: 1 })).toEqual({ id: 1 })
    expect(queryBranchContent).toHaveBeenCalledTimes(1)
  })

  it('should freeze only roots at depth zero and reject unsupported depth before reading', async () => {
    vi.mocked(queryBranchContent)
      .mockClear()
      .mockResolvedValue(page([{ id: 1, related: [2] }]))
    const { graph } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 0,
      req: makeRequest(),
    })

    expect(graph.get({ collection: 'roots', id: 1 })).toEqual({ id: 1, related: [2] })
    expect(() => graph.get({ collection: 'targets', id: 2 })).toThrow()
    await expect(
      queryBranchContentGraph({
        branchID: 'drafts',
        collection: 'roots',
        depth: 11,
        req: makeRequest(),
      }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    expect(queryBranchContent).toHaveBeenCalledTimes(1)
  })
  it('should isolate the same typed ID and negative result across branches and locale contexts', async () => {
    vi.mocked(queryBranchContent).mockImplementation(async (args) =>
      args.collection === 'roots'
        ? page([{ id: 1, related: [1] }])
        : page(
            args.branchID === 'drafts' && args.req.locale === 'en'
              ? [{ id: 1, title: 'drafts/en' }]
              : [],
          ),
    )
    const firstReq = makeRequest()
    const secondReq = makeRequest()

    firstReq.locale = 'en'
    secondReq.locale = 'fr'
    const first = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'roots',
      depth: 1,
      req: firstReq,
    })
    const second = await queryBranchContentGraph({
      branchID: 'staging',
      collection: 'roots',
      depth: 1,
      req: secondReq,
    })

    expect(first.graph.get({ collection: 'targets', id: 1 })).toEqual({ id: 1, title: 'drafts/en' })
    expect(second.graph.get({ collection: 'targets', id: 1 })).toBeNull()
    expect(first.graph.get({ collection: 'targets', id: 1 })).toEqual({ id: 1, title: 'drafts/en' })
  })

  it.each([undefined, { details: true }])(
    'should isolate returned root content and graph reads across a related cycle with select %j',
    async (select) => {
      const root = { id: 1, related: [2], details: { title: 'root' } }
      const target = { id: 2, parent: 1, opaque: { title: 'target' } }

      vi.mocked(queryBranchContent)
        .mockClear()
        .mockImplementation(async ({ collection }) =>
          page(collection === 'roots' ? [root] : [target]),
        )
      const { graph, result } = await queryBranchContentGraph({
        branchID: 'drafts',
        collection: 'roots',
        depth: 2,
        req: makeRequest(),
        select,
      })

      const details = result.docs[0].details as { title: string }

      details.title = 'changed root result'
      const related = graph.get({ collection: 'targets', id: 2 })! as typeof target

      related.opaque.title = 'changed population result'
      expect(graph.get({ collection: 'roots', id: 1 })).toEqual({
        id: 1,
        related: [2],
        details: { title: 'root' },
      })
      expect(graph.get({ collection: 'targets', id: 2 })).toEqual(target)
      expect(queryBranchContent).toHaveBeenCalledTimes(2)
    },
  )
})
