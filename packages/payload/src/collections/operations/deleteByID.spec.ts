import { describe, expect, it, vi } from 'vitest'

import { deleteOperation } from './delete.js'
import { deleteByIDOperation } from './deleteByID.js'

type DbCall = {
  kind: 'deleteMany' | 'deleteOne' | 'find' | 'findOne'
  collection: string
  where?: unknown
}

const buildMocks = () => {
  const calls: DbCall[] = []

  const userDoc = { id: 'user1', email: 'user1@test.com' }

  const collectionConfig = {
    slug: 'users',
    auth: true,
    access: { delete: () => true },
    fields: [],
    flattenedFields: [],
    hooks: {},
    lockDocuments: true,
  }

  const db = {
    name: 'postgres',
    findOne: vi.fn(async () => userDoc),
    find: vi.fn(async () => ({ docs: [userDoc] })),
    deleteOne: vi.fn(async ({ collection, where }: any) => {
      calls.push({ kind: 'deleteOne', collection, where })
      return userDoc
    }),
    deleteMany: vi.fn(async ({ collection, where }: any) => {
      calls.push({ kind: 'deleteMany', collection, where })
      return { docs: [], errors: [] }
    }),
  }

  const payload: any = {
    collections: {
      users: { config: collectionConfig },
      'payload-locked-documents': { config: { slug: 'payload-locked-documents' } },
    },
    config: {
      defaultDepth: 1,
      maxDepth: 10,
    },
    db,
  }

  const req: any = {
    context: {},
    fallbackLocale: 'en',
    locale: 'en',
    payload,
    t: (key: string) => key,
    user: { id: 'admin1' },
  }

  return { calls, collectionConfig, db, payload, req, userDoc }
}

const indexOfCall = (calls: DbCall[], kind: DbCall['kind'], collection: string) =>
  calls.findIndex((call) => call.kind === kind && call.collection === collection)

describe('deleteByIDOperation user cleanup', () => {
  it('should delete preferences and user-owned locks before the user row', async () => {
    const { calls, collectionConfig, req } = buildMocks()

    await deleteByIDOperation({
      id: 'user1',
      collection: { config: collectionConfig } as any,
      depth: 0,
      disableTransaction: true,
      overrideAccess: true,
      overrideLock: true,
      req,
    } as any)

    const preferencesIndex = indexOfCall(calls, 'deleteMany', 'payload-preferences')
    const locksIndex = indexOfCall(calls, 'deleteMany', 'payload-locked-documents')
    const userDeleteIndex = indexOfCall(calls, 'deleteOne', 'users')

    expect(preferencesIndex).toBeGreaterThanOrEqual(0)
    expect(locksIndex).toBeGreaterThanOrEqual(0)
    expect(userDeleteIndex).toBeGreaterThanOrEqual(0)
    expect(preferencesIndex).toBeLessThan(userDeleteIndex)
    expect(locksIndex).toBeLessThan(userDeleteIndex)
  })

  it('should scope the lock cleanup to locks owned by the deleted user', async () => {
    const { calls, collectionConfig, req } = buildMocks()

    await deleteByIDOperation({
      id: 'user1',
      collection: { config: collectionConfig } as any,
      depth: 0,
      disableTransaction: true,
      overrideAccess: true,
      overrideLock: true,
      req,
    } as any)

    const lockCall = calls.find(
      (call) =>
        call.kind === 'deleteMany' &&
        call.collection === 'payload-locked-documents' &&
        JSON.stringify(call.where).includes('user.value'),
    )
    const and = (lockCall?.where as any)?.and

    expect(and).toContainEqual({ 'user.value': { in: ['user1'] } })
    expect(and).toContainEqual({ 'user.relationTo': { equals: 'users' } })
  })
})

describe('deleteOperation user cleanup', () => {
  it('should delete preferences and user-owned locks before the user rows', async () => {
    const { calls, collectionConfig, req } = buildMocks()

    await deleteOperation({
      collection: { config: collectionConfig } as any,
      depth: 0,
      disableTransaction: true,
      overrideAccess: true,
      overrideLock: true,
      req,
      where: { id: { equals: 'user1' } },
    } as any)

    const preferencesIndex = indexOfCall(calls, 'deleteMany', 'payload-preferences')
    const locksIndex = calls.findIndex(
      (call) =>
        call.kind === 'deleteMany' &&
        call.collection === 'payload-locked-documents' &&
        JSON.stringify(call.where).includes('user.value'),
    )
    const userDeleteIndex = indexOfCall(calls, 'deleteMany', 'users')

    expect(preferencesIndex).toBeGreaterThanOrEqual(0)
    expect(locksIndex).toBeGreaterThanOrEqual(0)
    expect(userDeleteIndex).toBeGreaterThanOrEqual(0)
    expect(preferencesIndex).toBeLessThan(userDeleteIndex)
    expect(locksIndex).toBeLessThan(userDeleteIndex)
  })
})
