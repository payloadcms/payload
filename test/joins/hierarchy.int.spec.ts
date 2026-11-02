import type { FindOptions, PaginatedDocs, Payload } from 'payload'

import { expect } from 'vitest'

import type { Version } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { versionsSlug } from './shared.js'

// This fixture adds hierarchy fields without changing the shared Versions collection's types.
type HierarchyPayload = {
  create: (
    options: {
      collection: typeof versionsSlug
      data: { parent?: Version['id'] } & Pick<Version, '_status' | 'title'>
    } & Pick<Parameters<Payload['create']>[0], 'draft' | 'overrideAccess' | 'publishAllLocales'>,
  ) => Promise<Version>
  find: (
    options: {
      joins?:
        | {
            children: { count: boolean; limit: number; page?: number; sort: string }
          }
        | false
    } & Omit<FindOptions<typeof versionsSlug, never>, 'joins'>,
  ) => Promise<PaginatedDocs<Version>>
}

test.suite('Localized hierarchy joins', { config: './hierarchy.config.ts', db: 'drizzle' }, () => {
  test('should populate hierarchy children for anonymous published-only reads', async ({
    payload: payloadInstance,
  }) => {
    const payload = payloadInstance as unknown as HierarchyPayload
    const parent = await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Parent', _status: 'published' },
    })
    const publishedChild = await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Published child', parent: parent.id, _status: 'published' },
    })

    await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Draft child', parent: parent.id, _status: 'draft' },
      draft: true,
    })

    const withoutJoins = await payload.find({
      collection: versionsSlug,
      overrideAccess: false,
      joins: false,
    })
    const withJoins = await payload.find({
      collection: versionsSlug,
      overrideAccess: false,
    })
    const result = withJoins.docs.find(({ id }) => id === parent.id)

    expect(withJoins.docs.map(({ id }) => id).sort()).toEqual(
      withoutJoins.docs.map(({ id }) => id).sort(),
    )
    expect(withJoins.docs).toHaveLength(2)
    expect(result).toMatchObject({
      children: {
        docs: [
          { relationTo: versionsSlug, value: expect.objectContaining({ id: publishedChild.id }) },
        ],
      },
    })
  })

  test('should count and paginate published children once across all locales', async ({
    payload: payloadInstance,
  }) => {
    const payload = payloadInstance as unknown as HierarchyPayload
    const parent = await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Parent', _status: 'published' },
      publishAllLocales: true,
    })
    const firstChild = await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'First child', parent: parent.id, _status: 'published' },
      publishAllLocales: true,
    })
    const secondChild = await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Second child', parent: parent.id, _status: 'published' },
      publishAllLocales: true,
    })

    await payload.create({
      collection: versionsSlug,
      overrideAccess: true,
      data: { title: 'Draft child', parent: parent.id, _status: 'draft' },
      draft: true,
    })

    const unpaginated = await payload.find({
      collection: versionsSlug,
      depth: 0,
      locale: 'all',
      overrideAccess: false,
      where: { id: { equals: parent.id } },
      joins: { children: { count: true, limit: 0, sort: 'id' } },
    })
    const paginated = await payload.find({
      collection: versionsSlug,
      depth: 0,
      locale: 'all',
      overrideAccess: false,
      where: { id: { equals: parent.id } },
      joins: { children: { count: true, limit: 1, page: 2, sort: 'id' } },
    })

    // UUIDs do not necessarily sort in creation order.
    const sortedChildIDs = [firstChild.id, secondChild.id].sort((a, b) => (a < b ? -1 : 1))

    expect(unpaginated.docs[0]).toMatchObject({
      children: {
        docs: sortedChildIDs.map((id) => ({ relationTo: versionsSlug, value: id })),
        totalDocs: 2,
      },
    })
    expect(paginated.docs[0]).toMatchObject({
      children: {
        docs: [{ relationTo: versionsSlug, value: sortedChildIDs[1] }],
        hasNextPage: false,
        totalDocs: 2,
      },
    })
  })
})
