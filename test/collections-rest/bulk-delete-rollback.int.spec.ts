import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './config.js'

test.suite('Collections REST - bulk delete rollback', { config: './config.ts' }, () => {
  test.skipIf(
    process.env.PAYLOAD_DATABASE === 'cosmosdb' || process.env.PAYLOAD_DATABASE === 'documentdb',
  )('should roll back when the batched deleteMany fails', async ({ payload }) => {
    const title = 'bulk-delete-failure'

    const post = await payload.create({
      collection: postsSlug,
      data: { title },
      overrideAccess: true,
    })
    await payload.create({
      collection: postsSlug,
      data: { title },
      overrideAccess: true,
    })

    const { docs: users } = await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
    })

    const preference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${postsSlug}-${post.id}`,
        value: { collapsed: true },
      },
      overrideAccess: true,
      user: { ...users[0], collection: 'users' },
    })

    const originalDeleteMany = payload.db.deleteMany.bind(payload.db)
    const deleteManySpy = vi.spyOn(payload.db, 'deleteMany').mockImplementation(async (args) => {
      if (args.collection === postsSlug) {
        throw new Error('database connection lost')
      }

      return originalDeleteMany(args)
    })
    const beginSpy = vi.spyOn(payload.db, 'beginTransaction')
    const commitSpy = vi.spyOn(payload.db, 'commitTransaction')
    const rollbackSpy = vi.spyOn(payload.db, 'rollbackTransaction')

    const result = await payload.delete({
      collection: postsSlug,
      overrideAccess: true,
      where: { title: { equals: title } },
    })

    const transactionID = await beginSpy.mock.results[0]?.value
    const commitCalls = commitSpy.mock.calls.length
    const rollbackCalls = rollbackSpy.mock.calls.length

    deleteManySpy.mockRestore()
    beginSpy.mockRestore()
    commitSpy.mockRestore()
    rollbackSpy.mockRestore()

    expect(result.docs).toHaveLength(0)
    expect(result.errors).toHaveLength(2)
    expect(result.errors.every(({ message }) => message.startsWith('Bulk delete failed'))).toBe(
      true,
    )
    expect(commitCalls).toBe(0)
    expect(rollbackCalls).toBe(transactionID ? 1 : 0)

    const remainingDocs = await payload.find({
      collection: postsSlug,
      overrideAccess: true,
      where: { title: { equals: title } },
    })

    expect(remainingDocs.docs).toHaveLength(2)

    const { docs: remainingPreferences } = await payload.find({
      collection: 'payload-preferences',
      overrideAccess: true,
      where: { id: { equals: preference.id } },
    })

    // Cleanup runs before deletion; only transactional adapters can restore it on failure.
    expect(remainingPreferences).toHaveLength(transactionID ? 1 : 0)
  })
})
