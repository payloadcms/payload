import type { Where } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { accessJoinArticlesSlug, accessJoinNotesSlug, accessJoinParentsSlug } from './shared.js'

test.suite('Polymorphic join row filters', { config: './config.ts' }, () => {
  test('should match whole rows before counting polymorphic join results', async ({ payload }) => {
    const {
      docs: [user],
    } = await payload.find({ collection: 'users', overrideAccess: true })
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const matching = await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        parent: parent.id,
        tags: ['available'],
        items: [{ heading: 'Welcome', published: true, rank: 1 }],
        content: [
          { blockType: 'section', heading: 'Unrelated section' },
          { blockType: 'hero', heading: 'Welcome' },
        ],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        parent: parent.id,
        tags: ['available'],
        items: [
          { heading: 'Welcome', published: false, rank: 1 },
          { heading: 'Introduction', published: true },
        ],
        content: [
          { blockType: 'section', heading: 'Welcome' },
          { blockType: 'hero', heading: 'Introduction' },
        ],
      },
      overrideAccess: true,
    })
    const note = await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id, tags: ['available'], title: 'Welcome' },
      overrideAccess: true,
    })

    const expectMatchingRows = async ({
      joinWhere,
      where,
    }: {
      joinWhere?: Where
      where: Where
    }) => {
      const readParent = () =>
        payload.findByID({
          collection: accessJoinParentsSlug,
          depth: 0,
          id: parent.id,
          joins: { children: { count: true, where: joinWhere ?? where } },
          overrideAccess: false,
          user,
        })

      const joinedResults = [(await readParent()).children]

      if ('useJoinAggregations' in payload.db) {
        const useJoinAggregations = payload.db.useJoinAggregations
        payload.db.useJoinAggregations = false

        try {
          joinedResults.push((await readParent()).children)
        } finally {
          payload.db.useJoinAggregations = useJoinAggregations
        }
      }

      for (const children of joinedResults) {
        expect(children).toMatchObject({
          docs: [{ relationTo: accessJoinArticlesSlug, value: matching.id }],
          totalDocs: 1,
        })
      }
    }

    await expectMatchingRows({
      where: {
        content: { contains: { blockType: { equals: 'hero' }, heading: { equals: 'Welcome' } } },
      },
    })
    const arrayWhere = {
      items: {
        contains: {
          heading: { equals: 'Welcome' },
          published: { equals: true },
          rank: { in: ['1'] },
        },
      },
    }
    await expectMatchingRows({
      joinWhere: { and: [{ relationTo: { equals: accessJoinArticlesSlug } }, arrayWhere] },
      where: arrayWhere,
    })

    const withAccessRule = await payload.findByID({
      collection: accessJoinParentsSlug,
      context: { requireWelcomeItem: true },
      depth: 0,
      id: parent.id,
      joins: { children: { count: true } },
      overrideAccess: false,
      user,
    })
    expect(withAccessRule.children?.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relationTo: accessJoinArticlesSlug, value: matching.id }),
        expect.objectContaining({ relationTo: accessJoinNotesSlug, value: note.id }),
      ]),
    )
    expect(withAccessRule.children?.totalDocs).toBe(2)
  })

  test('should plan same-named fields after scoping each collection', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: { parent: parent.id, localizedItems: [{ heading: 'Welcome' }] },
      overrideAccess: true,
    })
    const note = await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id, localizedItems: 'Welcome' },
      overrideAccess: true,
    })

    const rowFilter: Where = { localizedItems: { contains: { heading: { equals: 'Welcome' } } } }
    const articleFilter: Where = {
      and: [{ relationTo: { equals: accessJoinArticlesSlug } }, rowFilter],
    }
    const findChildren = (where: Where) =>
      payload.findByID({
        collection: accessJoinParentsSlug,
        depth: 0,
        id: parent.id,
        joins: { children: { count: true, where } },
        overrideAccess: true,
      })

    const articleResult = await findChildren(articleFilter)

    expect(articleResult.children).toMatchObject({
      docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
      totalDocs: 1,
    })

    const mixedResult = await findChildren({
      or: [
        articleFilter,
        {
          and: [
            { relationTo: { equals: accessJoinNotesSlug } },
            { localizedItems: { equals: 'Welcome' } },
          ],
        },
      ],
    })

    expect(mixedResult.children?.totalDocs).toBe(2)
    expect(mixedResult.children?.docs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relationTo: accessJoinArticlesSlug, value: article.id }),
        expect.objectContaining({ relationTo: accessJoinNotesSlug, value: note.id }),
      ]),
    )
    await expect(findChildren(rowFilter)).rejects.toMatchObject({ name: 'QueryError' })
  })

  test('should join matching rows inside a group and named tab', async ({ payload }) => {
    const parent = await payload.create({
      collection: accessJoinParentsSlug,
      data: {},
      overrideAccess: true,
    })
    const article = await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        parent: parent.id,
        details: {
          editorial: {
            callouts: [{ blockType: 'editorNote', heading: 'Welcome' }],
            items: [{ heading: 'Welcome', published: true }],
          },
        },
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: accessJoinArticlesSlug,
      data: {
        parent: parent.id,
        details: {
          editorial: {
            callouts: [{ blockType: 'editorNote', heading: 'Introduction' }],
            items: [{ heading: 'Welcome' }, { published: true }],
          },
        },
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: accessJoinNotesSlug,
      data: { parent: parent.id },
      overrideAccess: true,
    })

    const filters: Where[] = [
      {
        'details.editorial.items': {
          contains: { heading: { equals: 'Welcome' }, published: { equals: true } },
        },
      },
      {
        'details.editorial.callouts': {
          contains: { blockType: { equals: 'editorNote' }, heading: { equals: 'Welcome' } },
        },
      },
    ]

    const checkJoinedRows = async () => {
      for (const where of filters) {
        const { children } = await payload.findByID({
          collection: accessJoinParentsSlug,
          depth: 0,
          id: parent.id,
          joins: { children: { count: true, where } },
          overrideAccess: true,
        })

        expect(children).toMatchObject({
          docs: [{ relationTo: accessJoinArticlesSlug, value: article.id }],
          totalDocs: 1,
        })
      }
    }

    await checkJoinedRows()

    if ('useJoinAggregations' in payload.db) {
      const useJoinAggregations = payload.db.useJoinAggregations
      payload.db.useJoinAggregations = false

      try {
        await checkJoinedRows()
      } finally {
        payload.db.useJoinAggregations = useJoinAggregations
      }
    }
  })
})
