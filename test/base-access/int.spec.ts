import { createLocalReq, Forbidden, getAccessResults } from 'payload'
import { expect } from 'vitest'

import { suite, test } from '../__helpers/int/vitest.js'
import { denyHeader, postsSlug, settingsSlug, tenantHeader } from './config.js'

const createRequest = async ({
  headers,
  payload,
}: {
  headers: Record<string, string>
  payload: Parameters<typeof createLocalReq>[1]
}) =>
  createLocalReq(
    {
      req: {
        headers: new Headers(headers),
      },
    },
    payload,
  )

suite('baseAccess', { config: './config.ts' }, () => {
  test('should combine base and collection query constraints', async ({ payload }) => {
    for (const data of [
      {
        status: 'published',
        tenant: 'tenant-1',
        title: 'visible',
      },
      {
        status: 'draft',
        tenant: 'tenant-1',
        title: 'resource-filtered',
      },
      {
        status: 'published',
        tenant: 'tenant-2',
        title: 'base-filtered',
      },
    ]) {
      await payload.create({
        collection: postsSlug,
        data,
      })
    }
    const req = await createRequest({
      headers: {
        [tenantHeader]: 'tenant-1',
      },
      payload,
    })

    const result = await payload.find({
      collection: postsSlug,
      overrideAccess: false,
      req,
    })

    expect(result.docs.map(({ title }) => title)).toEqual(['visible'])
  })

  test('should enforce base access and preserve overrideAccess', async ({ payload }) => {
    const req = await createRequest({
      headers: {
        [denyHeader]: 'true',
      },
      payload,
    })
    const data = {
      status: 'published',
      tenant: 'tenant-1',
      title: 'created with override',
    }

    await expect(
      payload.create({
        collection: postsSlug,
        data,
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow(Forbidden)

    const doc = await payload.create({
      collection: postsSlug,
      data,
      req,
    })

    expect(doc.title).toBe(data.title)
  })

  test('should enforce base access for globals', async ({ payload }) => {
    const req = await createRequest({
      headers: {
        [denyHeader]: 'true',
      },
      payload,
    })

    await expect(
      payload.updateGlobal({
        slug: settingsSlug,
        data: {
          title: 'denied',
        },
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow(Forbidden)
  })

  test('should enforce base access for generated collections', async ({ payload }) => {
    const req = await createRequest({
      headers: {
        [denyHeader]: 'true',
      },
      payload,
    })
    req.user = {
      id: 'admin-user',
      collection: 'users',
      createdAt: new Date().toISOString(),
      email: 'admin@example.com',
      updatedAt: new Date().toISOString(),
    }

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: 'denied@example.com',
          password: 'password',
        },
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow(Forbidden)
  })

  test('should enforce base admin access in access results', async ({ payload }) => {
    const allowedReq = await createRequest({ headers: {}, payload })
    allowedReq.user = {
      id: 'admin-user',
      collection: 'users',
      createdAt: new Date().toISOString(),
      email: 'admin@example.com',
      updatedAt: new Date().toISOString(),
    }

    const allowedPermissions = await getAccessResults({ req: allowedReq })

    expect(allowedPermissions.canAccessAdmin).toBe(true)

    const deniedReq = await createRequest({
      headers: {
        [denyHeader]: 'true',
      },
      payload,
    })
    deniedReq.user = allowedReq.user

    const deniedPermissions = await getAccessResults({ req: deniedReq })

    expect(deniedPermissions.canAccessAdmin).toBeUndefined()
  })
})
