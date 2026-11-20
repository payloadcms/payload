import type { Sort } from 'payload'

import { getInitialTreeData } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { organizationsSlug } from './shared.js'

test.suite('Hierarchy sorting', { config: './config.ts' }, () => {
  const cases: { name: string; sort?: Sort }[] = [
    { name: 'the title fallback' },
    { name: 'a descending defaultSort', sort: '-title' },
    { name: 'a multi-field defaultSort', sort: ['-title', 'id'] },
  ]

  for (const { name, sort } of cases) {
    test(`should use ${name} for initial roots, expanded children and selected-node pagination`, async ({
      payload,
    }) => {
      await payload.delete({ collection: organizationsSlug, overrideAccess: true, where: {} })

      const config = payload.collections[organizationsSlug].config
      const originalSort = config.defaultSort
      const { user } = await payload.login({
        collection: 'users',
        data: devUser,
      })

      try {
        config.defaultSort = sort

        const createDocument = ({ parent, title }: { parent?: number | string; title: string }) =>
          payload.create({
            collection: organizationsSlug,
            data: { parent, title },
            overrideAccess: true,
          })
        const roots = [
          await createDocument({ title: 'Bravo' }),
          await createDocument({ title: 'Alpha' }),
          await createDocument({ title: 'Charlie' }),
        ] as const
        const parent = roots[0]
        const children = [
          await createDocument({ parent: parent.id, title: 'Bravo child' }),
          await createDocument({ parent: parent.id, title: 'Alpha child' }),
          await createDocument({ parent: parent.id, title: 'Charlie child' }),
        ] as const

        const orderedRoots = sort ? [roots[2], roots[0], roots[1]] : [roots[1], roots[0], roots[2]]
        const orderedChildren = sort
          ? [children[2], children[0], children[1]]
          : [children[1], children[0], children[2]]
        const tree = await getInitialTreeData({
          collectionSlug: organizationsSlug,
          expandedNodeIds: [parent.id],
          limit: 2,
          payload,
          selectedNodeId: sort ? roots[1].id : roots[2].id,
          selectedNodeParentId: null,
          user,
        })

        expect(tree.docs.map(({ id }) => id)).toEqual([
          ...orderedRoots.map(({ id }) => id),
          ...orderedChildren.slice(0, 2).map(({ id }) => id),
        ])
        expect(tree.loadedParents.null.hasMore).toBe(false)
        expect(tree.loadedParents[String(parent.id)].hasMore).toBe(true)
      } finally {
        config.defaultSort = originalSort
      }
    })
  }
})
