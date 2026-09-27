import type { Payload } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const describeDrizzle =
  process.env.PAYLOAD_DATABASE?.startsWith('postgres') ||
  process.env.PAYLOAD_DATABASE?.startsWith('sqlite')
    ? describe
    : describe.skip

describeDrizzle('Version query database selection', () => {
  let payload: Payload
  const documentIDs: (number | string)[] = []

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    for (const id of documentIDs) {
      await payload.delete({ id, collection: 'versioned-posts' })
    }
    documentIDs.length = 0
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', where: {} })
    await payload.destroy()
  })

  it('should not fetch version arrays and blocks when only the parent is selected', async () => {
    const post = await payload.create({
      collection: 'versioned-posts',
      data: {
        _status: 'published',
        array: [{ text: 'Array body' }],
        blocks: [{ blockType: 'test', text: 'Block body' }],
        text: 'Published title',
      },
    })

    documentIDs.push(post.id)

    await payload.update({
      id: post.id,
      collection: 'versioned-posts',
      data: { text: 'New draft title' },
      draft: true,
    })

    const fullVersions = await payload.db.findVersions({
      collection: 'versioned-posts',
      where: { parent: { equals: post.id } },
    })
    const selectedVersions = await payload.db.findVersions({
      collection: 'versioned-posts',
      select: { parent: true },
      where: {
        and: [{ parent: { in: [post.id] } }, { 'version._status': { equals: 'published' } }],
      },
    })

    expect(fullVersions.docs[0].version.array).toHaveLength(1)
    expect(fullVersions.docs[0].version.blocks).toHaveLength(1)
    expect(selectedVersions.docs).toHaveLength(1)
    expect(selectedVersions.docs[0].parent).toBe(post.id)
    expect(selectedVersions.docs[0].version?.array).toBeUndefined()
    expect(selectedVersions.docs[0].version?.blocks).toBeUndefined()
  })

  it('should retain arrays and blocks when the entire version group is selected', async () => {
    const post = await payload.create({
      collection: 'versioned-posts',
      data: {
        _status: 'published',
        array: [{ text: 'Array body' }],
        blocks: [{ blockType: 'test', text: 'Block body' }],
      },
    })

    documentIDs.push(post.id)

    const result = await payload.db.findVersions({
      collection: 'versioned-posts',
      select: { version: true },
      where: { parent: { equals: post.id } },
    })

    expect(result.docs[0].version.array).toHaveLength(1)
    expect(result.docs[0].version.blocks).toHaveLength(1)
  })
})
