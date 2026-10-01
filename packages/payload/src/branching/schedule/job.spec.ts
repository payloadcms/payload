import { beforeEach, describe, expect, test, vi } from 'vitest'

const mergeBranch = vi.hoisted(() => vi.fn())

vi.mock('../merge.js', () => ({ mergeBranch }))

import type { ScheduleMergeTaskInput } from './job.js'

import { getScheduleMergeTask } from './job.js'

type ScheduleMergeTask = ReturnType<typeof getScheduleMergeTask>
type ScheduleMergeTaskHandler = Exclude<ScheduleMergeTask['handler'], string>

const runScheduleMergeTask = ({ input, req }: { input: ScheduleMergeTaskInput; req: unknown }) => {
  const task = getScheduleMergeTask({
    authCollectionSlugs: ['users', 'secondary-users'],
  })

  if (typeof task.handler !== 'function') {
    throw new Error('Expected scheduleMerge to use an inline task handler.')
  }

  return task.handler({ input, req } as Parameters<ScheduleMergeTaskHandler>[0])
}

describe('scheduleMerge task user identity', () => {
  beforeEach(() => {
    mergeBranch.mockReset()
    mergeBranch.mockResolvedValue({ merged: [], warnings: [] })
  })

  test('should resolve the scheduling user from the recorded auth collection', async () => {
    const secondaryUser = {
      collection: 'secondary-users',
      email: 'secondary@example.com',
      id: 'shared-id',
    }
    const wrongAdminUser = {
      collection: 'users',
      email: 'admin@example.com',
      id: 'shared-id',
    }
    const findByID = vi.fn(({ collection, id }: { collection: string; id: number | string }) => {
      if (collection === 'secondary-users' && id === 'shared-id') {
        return Promise.resolve(secondaryUser)
      }

      if (collection === 'users' && id === 'shared-id') {
        return Promise.resolve(wrongAdminUser)
      }

      return Promise.resolve(null)
    })
    const req = {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        findByID,
      },
    }

    await expect(
      runScheduleMergeTask({
        input: {
          branch: 'campaign',
          user: { relationTo: 'secondary-users', value: 'shared-id' },
        },
        req,
      }),
    ).resolves.toEqual({ output: { merged: 0, warnings: [] } })

    expect(mergeBranch).toHaveBeenCalledWith(
      req.payload,
      expect.objectContaining({
        overrideAccess: false,
        user: secondaryUser,
      }),
    )
  })

  test('should reject a bare user ID instead of using an admin user with the same ID', async () => {
    const wrongAdminUser = {
      collection: 'users',
      email: 'admin@example.com',
      id: 'shared-id',
    }
    const req = {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        findByID: vi.fn().mockResolvedValue(wrongAdminUser),
      },
    }

    await expect(
      runScheduleMergeTask({
        input: { branch: 'campaign', user: 'shared-id' },
        req,
      }),
    ).rejects.toThrow('missing the scheduling user auth collection')

    expect(mergeBranch).not.toHaveBeenCalled()
  })

  test('should reject a relationship to a non-auth collection before loading the user', async () => {
    const findByID = vi.fn()
    const req = {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        findByID,
      },
    }

    await expect(
      runScheduleMergeTask({
        input: {
          branch: 'campaign',
          user: { relationTo: 'posts', value: 'shared-id' },
        },
        req,
      }),
    ).rejects.toThrow('invalid scheduling user relationship')

    expect(findByID).not.toHaveBeenCalled()
    expect(mergeBranch).not.toHaveBeenCalled()
  })

  test('should reject a non-scalar relationship value before loading the user', async () => {
    const findByID = vi.fn()
    const req = {
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        findByID,
      },
    }

    await expect(
      runScheduleMergeTask({
        input: {
          branch: 'campaign',
          user: {
            relationTo: 'secondary-users',
            value: { id: 'shared-id' },
          } as never,
        },
        req,
      }),
    ).rejects.toThrow('invalid scheduling user relationship')

    expect(findByID).not.toHaveBeenCalled()
    expect(mergeBranch).not.toHaveBeenCalled()
  })
})
