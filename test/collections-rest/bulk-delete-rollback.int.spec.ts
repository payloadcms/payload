import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './config.js'

test.suite({ config: './config.ts' })('Collections REST - bulk delete rollback', () => {
  test.skipIf(
    process.env.PAYLOAD_DATABASE === 'cosmosdb' || process.env.PAYLOAD_DATABASE === 'documentdb',
  )('should roll back when the batched deleteMany fails', async ({ payload }) => {
    const title = 'bulk-delete-failure'

    await payload.create({
      collection: postsSlug,
      data: { title },
    })
    await payload.create({
      collection: postsSlug,
      data: { title },
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
      where: { title: { equals: title } },
    })

    const deletedCollections = deleteManySpy.mock.calls.map(([args]) => args.collection)
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
    expect(deletedCollections).not.toContain('payload-preferences')

    const remainingDocs = await payload.find({
      collection: postsSlug,
      where: { title: { equals: title } },
    })

    expect(remainingDocs.docs).toHaveLength(2)
  })
})
