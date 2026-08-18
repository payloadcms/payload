import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq, Forbidden, getAccessResults } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { denyHeader, postsSlug, settingsSlug, tenantHeader } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
const createdPostIDs: (number | string)[] = []

const createRequest = async (headers: Record<string, string>) =>
  createLocalReq(
    {
      req: {
        headers: new Headers(headers),
      },
    },
    payload,
  )

describe('baseAccess', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    for (const id of createdPostIDs) {
      await payload.delete({
        id,
        collection: postsSlug,
      })
    }
    createdPostIDs.length = 0
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should combine base and collection query constraints', async () => {
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
      const doc = await payload.create({
        collection: postsSlug,
        data,
      })
      createdPostIDs.push(doc.id)
    }
    const req = await createRequest({
      [tenantHeader]: 'tenant-1',
    })

    const result = await payload.find({
      collection: postsSlug,
      overrideAccess: false,
      req,
    })

    expect(result.docs.map(({ title }) => title)).toEqual(['visible'])
  })

  it('should enforce base access and preserve overrideAccess', async () => {
    const req = await createRequest({
      [denyHeader]: 'true',
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
    createdPostIDs.push(doc.id)

    expect(doc.title).toBe(data.title)
  })

  it('should enforce base access for globals', async () => {
    const req = await createRequest({
      [denyHeader]: 'true',
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

  it('should enforce base access for generated collections', async () => {
    const req = await createRequest({
      [denyHeader]: 'true',
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

  it('should enforce base admin access in access results', async () => {
    const allowedReq = await createRequest({})
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
      [denyHeader]: 'true',
    })
    deniedReq.user = allowedReq.user

    const deniedPermissions = await getAccessResults({ req: deniedReq })

    expect(deniedPermissions.canAccessAdmin).toBeUndefined()
  })
})
