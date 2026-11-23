import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { DEFAULT_HIERARCHY_LIST_LIMIT } from 'payload/shared'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Verify the Admin read without exposing its implementation.
import { getJoinedHierarchyDocuments } from '../../packages/ui/src/views/List/getJoinedHierarchyDocuments.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Verify the initial hierarchy view and its fallback.
import { handleHierarchy } from '../../packages/ui/src/views/List/handleHierarchy.js'
import { test } from '../__helpers/int/vitest.js'
import {
  joinedFolders as folders,
  joinedMedia as media,
  joinedPages as pages,
  joinedTags as tags,
  joinedTopics as topics,
} from './collections/joined.js'

test.suite('Joined hierarchy documents', { config: './joined.config.ts' }, () => {
  test('should count and page visible mixed documents through folder and tag memberships', async ({
    payload,
  }) => {
    const req = await createRequest(payload)
    const folder = await payload.create({
      overrideAccess: true,
      collection: folders,
      data: { name: 'Editorial' },
    })
    const tag = await payload.create({
      overrideAccess: true,
      collection: tags,
      data: { name: 'Featured' },
    })
    const otherTag = await payload.create({
      overrideAccess: true,
      collection: tags,
      data: { name: 'Other' },
    })
    const topic = await payload.create({
      overrideAccess: true,
      collection: topics,
      data: { name: 'Education' },
    })

    const limit = DEFAULT_HIERARCHY_LIST_LIMIT
    const visibleTitles = Array.from({ length: limit + 1 }, (_, index) => `Visible ${index}`)
    const createDocument = (title: string, minute: number, scope = 'public', visible = true) => {
      const timestamp = new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString()
      return payload.create({
        overrideAccess: true,
        collection: minute % 2 === 0 ? pages : media,
        data: {
          '_h_joined-folders': folder.id,
          '_h_joined-tags': [tag.id, otherTag.id],
          createdAt: timestamp,
          scope,
          title,
          topicParent: [topic.id],
          updatedAt: timestamp,
          visible,
        },
      })
    }

    for (const [index, title] of visibleTitles.entries()) {
      await createDocument(title, index)
    }
    await createDocument('Excluded by Admin', 40, 'private')
    await createDocument('Excluded by read access', 41, 'public', false)
    await payload.create({
      overrideAccess: true,
      collection: media,
      data: { '_h_joined-tags': [otherTag.id], scope: 'public', title: 'Other tag', visible: true },
    })

    for (const [collectionSlug, parentID] of [
      [folders, folder.id],
      [tags, tag.id],
      [topics, topic.id],
    ] as const) {
      const first = await getJoinedHierarchyDocuments({ collectionSlug, parentID, req })
      const second = await getJoinedHierarchyDocuments({ collectionSlug, page: 2, parentID, req })
      const expected = [...visibleTitles].reverse()

      expect(first?.docs.map((doc) => doc.title)).toEqual(expected.slice(0, limit))
      expect(second?.docs.map((doc) => doc.title)).toEqual(expected.slice(limit))
      expect([first?.totalDocs, second?.totalDocs]).toEqual([limit + 1, limit + 1])
      expect([first?.hasNextPage, second?.hasNextPage]).toEqual([true, false])

      const filtered = await getJoinedHierarchyDocuments({
        collectionSlug,
        parentID,
        req,
        search: 'Visible 1',
        typeFilter: [pages],
      })

      expect(filtered?.docs.map((doc) => doc.title)).toEqual([
        'Visible 18',
        'Visible 16',
        'Visible 14',
        'Visible 12',
        'Visible 10',
      ])
      expect(filtered?.totalDocs).toBe(5)
    }
  })

  test('should keep unrestricted child folders visible when filtering by type', async ({
    payload,
  }) => {
    const req = await createRequest(payload)
    const { config } = payload.collections[folders]
    const parent = await payload.create({
      overrideAccess: true,
      collection: folders,
      data: { name: 'Editorial' },
    })
    await payload.create({
      overrideAccess: true,
      collection: folders,
      data: { '_h_joined-folders': parent.id, name: 'Unrestricted' },
    })
    await payload.create({
      overrideAccess: true,
      collection: folders,
      data: { '_h_joined-folders': parent.id, hierarchyType: [media], name: 'Media only' },
    })
    await payload.create({
      overrideAccess: true,
      collection: folders,
      data: { '_h_joined-folders': parent.id, hierarchyType: [pages], name: 'Pages only' },
    })

    const result = await handleHierarchy({
      collectionConfig: config,
      collectionSlug: folders,
      parentId: parent.id,
      req,
      typeFilter: [media],
      user: req.user,
    })

    expect(result.childrenData.docs.map((doc) => doc.name).sort()).toEqual([
      'Media only',
      'Unrestricted',
    ])
  })
})

async function createRequest(payload: Payload) {
  const user = await payload.create({
    overrideAccess: true,
    collection: 'users',
    data: { email: 'editor@example.com', password: 'password' },
  })
  return createPayloadRequest({ payload, user: { ...user, collection: 'users' } })
}
