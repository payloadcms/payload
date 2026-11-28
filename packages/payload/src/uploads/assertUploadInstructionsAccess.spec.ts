import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { Forbidden } from '../errors/Forbidden.js'
import { assertUploadInstructionsAccess } from './assertUploadInstructionsAccess.js'

const createReq = ({ hasUser }: { hasUser: boolean }) =>
  ({ t: (key: string) => key, user: hasUser ? { id: 1 } : null }) as unknown as PayloadRequest

describe('assertUploadInstructionsAccess', () => {
  it.each([
    { expected: 'allow', hasUser: true },
    { expected: 'refuse', hasUser: false },
  ])('should $expected a request when no access rule is set', async ({ expected, hasUser }) => {
    const assertion = assertUploadInstructionsAccess({
      collectionSlug: 'media',
      req: createReq({ hasUser }),
    })

    if (expected === 'allow') {
      await expect(assertion).resolves.toBeUndefined()
    } else {
      await expect(assertion).rejects.toBeInstanceOf(Forbidden)
    }
  })

  it('should follow the access rule over the logged-in user', async () => {
    await expect(
      assertUploadInstructionsAccess({
        access: () => false,
        collectionSlug: 'media',
        req: createReq({ hasUser: true }),
      }),
    ).rejects.toBeInstanceOf(Forbidden)
    await expect(
      assertUploadInstructionsAccess({
        access: ({ collectionSlug }) => Promise.resolve(collectionSlug === 'media'),
        collectionSlug: 'media',
        req: createReq({ hasUser: false }),
      }),
    ).resolves.toBeUndefined()
  })
})
