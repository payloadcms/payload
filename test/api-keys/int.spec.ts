import type { Payload, TypeWithID } from 'payload'

import crypto from 'crypto'
import path from 'path'
import { payloadAPIKeysCollectionSlug, rotateSecret } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { idToString } from '../__helpers/shared/idToString.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { adminsSlug, customersSlug, otherCustomersSlug, verifiedCustomersSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient

const createdOwnerIDs: { collection: string; id: number | string }[] = []
const createdKeyIDs: (number | string)[] = []

let ownerCounter = 0

/** Normalizes an owner relationship value, regardless of population depth. */
const ownerID = (owner: { value: unknown }): string =>
  typeof owner.value === 'object' && owner.value !== null
    ? String((owner.value as { id: unknown }).id)
    : String(owner.value)

const createOwner = async (collection: string, data: Record<string, unknown> = {}) => {
  ownerCounter += 1
  const owner = await payload.create({
    collection,
    data: {
      email: `owner-${collection}-${ownerCounter}@example.com`,
      password: 'Password123!',
      ...data,
    },
  })
  createdOwnerIDs.push({ id: owner.id, collection })
  return owner
}

const authenticateWithAPIKey = ({
  apiKey,
  collectionSlug,
}: {
  apiKey: string
  collectionSlug: string
}) =>
  payload.auth({ headers: new Headers({ Authorization: `${collectionSlug} API-Key ${apiKey}` }) })

describe('payload-api-keys collection', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    for (const id of createdKeyIDs) {
      await payload
        .delete({ id, collection: payloadAPIKeysCollectionSlug, overrideAccess: true })
        .catch(() => null)
    }
    createdKeyIDs.length = 0

    for (const owner of createdOwnerIDs) {
      await payload.delete({ id: owner.id, collection: owner.collection }).catch(() => null)
    }
    createdOwnerIDs.length = 0
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should add the payload-api-keys collection when a collection uses collection storage', () => {
    expect(payload.collections[payloadAPIKeysCollectionSlug]).toBeDefined()
  })

  it('should expose an owners keys through the apiKeys join field on the auth collection', async () => {
    const alice = await createOwner(customersSlug)
    const keyOne = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Key one' },
      overrideAccess: false,
      user: alice,
    })
    const keyTwo = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Key two' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(keyOne.id, keyTwo.id)

    const found = await payload.findByID({
      id: alice.id,
      collection: customersSlug,
      overrideAccess: true,
    })

    expect(found.apiKeys?.docs).toHaveLength(2)
    const names = found.apiKeys!.docs.map((doc) => (typeof doc === 'object' ? doc.name : doc))
    expect(names.sort()).toEqual(['Key one', 'Key two'])
  })

  it('should let an owner create their own key with a server-generated secret', async () => {
    const alice = await createOwner(customersSlug)

    const key = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(key.id)

    expect(key.owner).toMatchObject({ relationTo: customersSlug, value: alice.id })
    expect(key.apiKey).toMatch(/^[\w-]{40,}$/)
  })

  it('should never return the secret on a subsequent read, even for the owner, even when owner is depth-populated', async () => {
    const alice = await createOwner(customersSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const foundShallow = await payload.findByID({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: alice,
    })
    const foundPopulated = await payload.findByID({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      depth: 1,
      overrideAccess: false,
      user: alice,
    })

    expect(foundShallow.apiKey).toBeFalsy()
    expect(foundPopulated.apiKey).toBeFalsy()
  })

  it('should ignore client-supplied owner and apiKeyHash on create', async () => {
    const alice = await createOwner(customersSlug)
    const admin = await createOwner(adminsSlug)

    const key = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: {
        name: 'Alice key',
        // @ts-expect-error - intentionally supplying fields the caller should not control
        apiKeyHash: 'attacker-chosen-hash',
        owner: { relationTo: adminsSlug, value: admin.id },
      },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(key.id)

    expect(key.owner.relationTo).toBe(customersSlug)
    expect(ownerID(key.owner)).toBe(String(alice.id))
    expect(key.apiKey).toMatch(/^[\w-]{40,}$/)

    const raw = await payload.db.findOne<{ apiKeyHash: string }>({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: key.id } },
    })
    expect(raw!.apiKeyHash).not.toBe('attacker-chosen-hash')
  })

  it('should not let an unrelated authenticated user discover another owner key', async () => {
    const alice = await createOwner(customersSlug)
    const bob = await createOwner(customersSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    await expect(
      payload.findByID({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        overrideAccess: false,
        user: bob,
      }),
    ).rejects.toThrow()

    const list = await payload.find({
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: bob,
      where: { id: { equals: created.id } },
    })
    expect(list.docs).toHaveLength(0)
  })

  it('should let an administrator read metadata without the secret and delete the key', async () => {
    const alice = await createOwner(customersSlug)
    const admin = await createOwner(adminsSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const foundByAdmin = await payload.findByID({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: admin,
    })

    expect(foundByAdmin.name).toBe('Alice key')
    expect(foundByAdmin.apiKey).toBeFalsy()

    const deleted = await payload.delete({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: admin,
    })
    createdKeyIDs.length = 0

    expect((deleted as TypeWithID).id).toBe(created.id)
    expect((deleted as { apiKey?: string }).apiKey).toBeFalsy()
  })

  it('should let a manage-tier administrator rename another owner key', async () => {
    const alice = await createOwner(customersSlug)
    const manageTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canManage' })
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const renamed = await payload.update({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Renamed by admin' },
      overrideAccess: false,
      user: manageTierAdmin,
    })

    expect(renamed.name).toBe('Renamed by admin')
    // Owner must stay Alice, not the administrator who renamed the key.
    expect(renamed.owner.relationTo).toBe(customersSlug)
    expect(ownerID(renamed.owner)).toBe(String(alice.id))
  })

  it('should not let a read-tier administrator rename another owner key', async () => {
    const alice = await createOwner(customersSlug)
    const readTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canSee' })
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    await expect(
      payload.update({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Renamed by admin' },
        overrideAccess: false,
        user: readTierAdmin,
      }),
    ).rejects.toThrow()
  })

  it('should not let an API-key-authenticated caller manage any credentials, including their own', async () => {
    const alice = await createOwner(customersSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const apiKeyCaller = { ...alice, _strategy: 'api-key' as const, collection: customersSlug }

    await expect(
      payload.findByID({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        overrideAccess: false,
        user: apiKeyCaller,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Second key' },
        overrideAccess: false,
        user: apiKeyCaller,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        overrideAccess: false,
        user: apiKeyCaller,
      }),
    ).rejects.toThrow()
  })

  it('should keep the owner immutable and ignore a client-supplied hash replacement on a plain rename', async () => {
    const alice = await createOwner(customersSlug)
    const bob = await createOwner(otherCustomersSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const beforeRaw = await payload.db.findOne<{ apiKeyHash: string }>({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: created.id } },
    })

    const updated = await payload.update({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      data: {
        name: 'Renamed by Alice',
        // @ts-expect-error - intentionally attempting to change protected fields
        apiKeyHash: 'attacker-chosen-hash',
        owner: { relationTo: otherCustomersSlug, value: bob.id },
      },
      overrideAccess: false,
      user: alice,
    })

    expect(updated.name).toBe('Renamed by Alice')
    expect(updated.owner).toMatchObject({ relationTo: customersSlug, value: alice.id })
    expect(updated.apiKey).toBeFalsy()

    const afterRaw = await payload.db.findOne<{ apiKeyHash: string }>({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: created.id } },
    })
    expect(afterRaw!.apiKeyHash).toBe(beforeRaw!.apiKeyHash)
    expect(afterRaw!.apiKeyHash).not.toBe('attacker-chosen-hash')
  })

  it('should store a one-way hash, never the plaintext secret or anything reversible, in the database', async () => {
    const alice = await createOwner(customersSlug)
    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    const raw = (await payload.db.findOne({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: created.id } },
    })) as { apiKey?: string; apiKeyHash: string }

    expect(raw.apiKey).toBeFalsy()
    expect(raw.apiKeyHash).toMatch(/^[0-9a-f]{64}$/)
    expect(raw.apiKeyHash).toBe(
      crypto
        .createHash('sha256')
        .update(created.apiKey as string)
        .digest('hex'),
    )
  })

  it('should let trusted server code provision a key for an explicit owner without req.user', async () => {
    const bob = await createOwner(customersSlug)

    const key = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: {
        name: 'Service key',
        owner: { relationTo: customersSlug, value: bob.id },
      },
      overrideAccess: true,
    })
    createdKeyIDs.push(key.id)

    expect(key.owner.relationTo).toBe(customersSlug)
    expect(ownerID(key.owner)).toBe(String(bob.id))
  })

  it('should never call payload.decrypt for any payload-api-keys create or read, for any requester', async () => {
    const alice = await createOwner(customersSlug)
    const admin = await createOwner(adminsSlug)

    const decryptSpy = vi.spyOn(payload, 'decrypt')

    const created = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(created.id)

    await payload.findByID({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: alice,
    })
    await payload.findByID({
      id: created.id,
      collection: payloadAPIKeysCollectionSlug,
      overrideAccess: false,
      user: admin,
    })

    expect(decryptSpy).not.toHaveBeenCalled()
    decryptSpy.mockRestore()
  })

  describe('collection-mode API key authentication', () => {
    const authenticate = (collection: string, apiKey: string) =>
      payload.auth({ headers: new Headers({ Authorization: `${collection} API-Key ${apiKey}` }) })

    it('should authenticate the owner of a collection-mode key', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      const { user } = await authenticate(customersSlug, key.apiKey as string)

      expect(user?.id).toBe(alice.id)
      expect(user?.collection).toBe(customersSlug)
      expect(user?._strategy).toBe('api-key')
    })

    it('should let two keys owned by the same user both authenticate, independently revocable', async () => {
      const alice = await createOwner(customersSlug)
      const keyOne = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Key one' },
        overrideAccess: false,
        user: alice,
      })
      const keyTwo = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Key two' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(keyOne.id, keyTwo.id)

      await payload.delete({
        id: keyOne.id,
        collection: payloadAPIKeysCollectionSlug,
        overrideAccess: true,
      })
      createdKeyIDs.splice(createdKeyIDs.indexOf(keyOne.id), 1)

      const revokedResult = await authenticate(customersSlug, keyOne.apiKey as string)
      const stillValidResult = await authenticate(customersSlug, keyTwo.apiKey as string)

      expect(revokedResult.user).toBeNull()
      expect(stillValidResult.user?.id).toBe(alice.id)
    })

    it('should require the header collection slug to match the key owner relationTo', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      const { user } = await authenticate(otherCustomersSlug, key.apiKey as string)

      expect(user).toBeNull()
    })

    it('should reject an unverified owner for a verification-required collection', async () => {
      const unverified = await createOwner(verifiedCustomersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Unverified key' },
        overrideAccess: false,
        user: unverified,
      })
      createdKeyIDs.push(key.id)

      const { user } = await authenticate(verifiedCustomersSlug, key.apiKey as string)

      expect(user).toBeNull()
    })

    it('should return no user for a malformed header, missing key, or garbage key', async () => {
      const malformed = await payload.auth({
        headers: new Headers({ Authorization: 'not-a-valid-header' }),
      })
      const missingKey = await payload.auth({
        headers: new Headers({ Authorization: `${customersSlug} API-Key ` }),
      })
      const garbageKey = await authenticate(customersSlug, 'plk_does-not-exist')

      expect(malformed.user).toBeNull()
      expect(missingKey.user).toBeNull()
      expect(garbageKey.user).toBeNull()
    })

    it('should never select or decrypt the secret while authenticating', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      const decryptSpy = vi.spyOn(payload, 'decrypt')

      const { user } = await authenticate(customersSlug, key.apiKey as string)

      expect(user?.id).toBe(alice.id)
      expect(decryptSpy).not.toHaveBeenCalled()
      decryptSpy.mockRestore()
    })
  })

  describe('owner deletion cleanup', () => {
    const authenticate = (collection: string, apiKey: string) =>
      payload.auth({ headers: new Headers({ Authorization: `${collection} API-Key ${apiKey}` }) })

    it('should delete all of an owners keys when the owner is deleted', async () => {
      const alice = await createOwner(customersSlug)
      const bob = await createOwner(customersSlug)
      const aliceKey = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      const bobKey = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Bob key' },
        overrideAccess: false,
        user: bob,
      })
      createdKeyIDs.push(aliceKey.id, bobKey.id)

      await payload.delete({ id: alice.id, collection: customersSlug })
      createdOwnerIDs.splice(
        createdOwnerIDs.findIndex((owner) => owner.id === alice.id),
        1,
      )

      const remainingAliceKey = await payload.db.findOne({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { equals: aliceKey.id } },
      })
      const remainingBobKey = await payload.db.findOne({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { equals: bobKey.id } },
      })

      expect(remainingAliceKey).toBeFalsy()
      expect(remainingBobKey).toBeTruthy()
      createdKeyIDs.splice(createdKeyIDs.indexOf(aliceKey.id), 1)
    })

    it('should delete keys for every owner removed by a bulk delete', async () => {
      const alice = await createOwner(customersSlug)
      const bob = await createOwner(customersSlug)
      const aliceKey = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      const bobKey = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Bob key' },
        overrideAccess: false,
        user: bob,
      })
      createdKeyIDs.push(aliceKey.id, bobKey.id)

      await payload.delete({
        collection: customersSlug,
        where: { id: { in: [alice.id, bob.id] } },
      })
      createdOwnerIDs.length = 0

      const remainingKeys = await payload.db.find({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { in: [aliceKey.id, bobKey.id] } },
      })

      expect(remainingKeys.docs).toHaveLength(0)
      createdKeyIDs.length = 0
    })

    it('should fail the owner deletion when cleanup fails, leaving the owner and key intact', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      const originalDelete = payload.delete.bind(payload)
      const deleteSpy = vi.spyOn(payload, 'delete').mockImplementation((async (args: {
        collection: string
      }) => {
        if (args.collection === payloadAPIKeysCollectionSlug) {
          throw new Error('Simulated cleanup failure')
        }
        return originalDelete(args as never)
      }) as never)

      await expect(payload.delete({ id: alice.id, collection: customersSlug })).rejects.toThrow()
      deleteSpy.mockRestore()

      const ownerStillExists = await payload.findByID({
        id: alice.id,
        collection: customersSlug,
        overrideAccess: true,
      })
      const keyStillExists = await payload.db.findOne({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { equals: key.id } },
      })

      expect(ownerStillExists).toBeTruthy()
      expect(keyStillExists).toBeTruthy()
    })

    it('should not authenticate an orphaned key whose owner no longer exists', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      // Simulate an owner removed through a path that bypasses the cleanup hook.
      await payload.db.deleteOne({ collection: customersSlug, where: { id: { equals: alice.id } } })
      createdOwnerIDs.splice(
        createdOwnerIDs.findIndex((owner) => owner.id === alice.id),
        1,
      )

      const { user } = await authenticate(customersSlug, key.apiKey as string)

      expect(user).toBeNull()
    })
  })

  describe('regenerating a key', () => {
    it('should let the owner regenerate their key, invalidating the old secret and revealing a new one', async () => {
      const alice = await createOwner(customersSlug)
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)
      const originalSecret = created.apiKey as string

      const regenerated = await payload.update({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        // @ts-expect-error - regenerate is a virtual, non-generated-type sentinel field
        data: { regenerate: true },
        overrideAccess: false,
        user: alice,
      })

      expect(regenerated.apiKey).toMatch(/^[\w-]{40,}$/)
      expect(regenerated.apiKey).not.toBe(originalSecret)

      expect(
        (await authenticateWithAPIKey({ apiKey: originalSecret, collectionSlug: customersSlug }))
          .user,
      ).toBeNull()
      expect(
        (
          await authenticateWithAPIKey({
            apiKey: regenerated.apiKey as string,
            collectionSlug: customersSlug,
          })
        ).user?.id,
      ).toBe(alice.id)
    })

    it('should not change apiKeyHash on a plain rename that does not request regeneration', async () => {
      const alice = await createOwner(customersSlug)
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)

      const beforeRaw = await payload.db.findOne<{ apiKeyHash: string }>({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { equals: created.id } },
      })

      await payload.update({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Renamed, not regenerated' },
        overrideAccess: false,
        user: alice,
      })

      const afterRaw = await payload.db.findOne<{ apiKeyHash: string }>({
        collection: payloadAPIKeysCollectionSlug,
        where: { id: { equals: created.id } },
      })
      expect(afterRaw!.apiKeyHash).toBe(beforeRaw!.apiKeyHash)
    })

    it('should let a manage-tier administrator regenerate another owner key, without reassigning ownership', async () => {
      const alice = await createOwner(customersSlug)
      const manageTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canManage' })
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)
      const originalSecret = created.apiKey as string

      const regenerated = await payload.update({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        // @ts-expect-error - regenerate is a virtual, non-generated-type sentinel field
        data: { regenerate: true },
        overrideAccess: false,
        user: manageTierAdmin,
      })

      expect(regenerated.apiKey).not.toBe(originalSecret)
      // Owner must stay Alice, not the administrator who triggered the regeneration.
      expect(regenerated.owner.relationTo).toBe(customersSlug)
      expect(ownerID(regenerated.owner)).toBe(String(alice.id))

      expect(
        (await authenticateWithAPIKey({ apiKey: originalSecret, collectionSlug: customersSlug }))
          .user,
      ).toBeNull()
      expect(
        (
          await authenticateWithAPIKey({
            apiKey: regenerated.apiKey as string,
            collectionSlug: customersSlug,
          })
        ).user?.id,
      ).toBe(alice.id)
    })

    it('should not let a read-tier administrator regenerate another owner key', async () => {
      const alice = await createOwner(customersSlug)
      const readTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canSee' })
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)

      await expect(
        payload.update({
          id: created.id,
          collection: payloadAPIKeysCollectionSlug,
          // @ts-expect-error - regenerate is a virtual, non-generated-type sentinel field
          data: { regenerate: true },
          overrideAccess: false,
          user: readTierAdmin,
        }),
      ).rejects.toThrow()
    })

    it('should not let an API-key-authenticated caller regenerate, even their own key', async () => {
      const alice = await createOwner(customersSlug)
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)

      const apiKeyCaller = { ...alice, _strategy: 'api-key' as const, collection: customersSlug }

      await expect(
        payload.update({
          id: created.id,
          collection: payloadAPIKeysCollectionSlug,
          // @ts-expect-error - regenerate is a virtual, non-generated-type sentinel field
          data: { regenerate: true },
          overrideAccess: false,
          user: apiKeyCaller,
        }),
      ).rejects.toThrow()
    })
  })

  describe('API key prefix', () => {
    it('should generate a key with no prefix by default', async () => {
      const alice = await createOwner(customersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(key.id)

      // base64url randomness can incidentally contain '_'/'-', so assert the full-length
      // shape rather than the absence of any particular character.
      expect(key.apiKey).toMatch(/^[\w-]{40,}$/)
    })

    it('should generate a key with the owning collection’s configured prefix', async () => {
      const bob = await createOwner(otherCustomersSlug)
      const key = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Bob key' },
        overrideAccess: false,
        user: bob,
      })
      createdKeyIDs.push(key.id)

      expect(key.apiKey).toMatch(/^oc_/)
    })

    it('should use the owning collection’s prefix, not the acting administrator’s, when a manage-tier administrator regenerates another owner key', async () => {
      const bob = await createOwner(otherCustomersSlug)
      const manageTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canManage' })
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Bob key' },
        overrideAccess: false,
        user: bob,
      })
      createdKeyIDs.push(created.id)

      const regenerated = await payload.update({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        // @ts-expect-error - regenerate is a virtual, non-generated-type sentinel field
        data: { regenerate: true },
        overrideAccess: false,
        user: manageTierAdmin,
      })

      expect(regenerated.apiKey).toMatch(/^oc_/)
    })
  })

  describe('GraphQL', () => {
    it('should let a manage-tier administrator regenerate another owner key via GraphQL', async () => {
      const alice = await createOwner(customersSlug)
      const manageTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canManage' })
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)
      const originalSecret = created.apiKey as string

      await restClient.login({
        slug: adminsSlug,
        credentials: { email: manageTierAdmin.email, password: 'Password123!' },
      })

      const query = `mutation {
        updatePayloadApiKey(id: ${idToString(created.id, payload)}, data: { regenerate: true }) {
          apiKey
        }
      }`

      const response = await restClient.GRAPHQL_POST({ body: JSON.stringify({ query }) })
      const { data, errors } = await response.json()

      expect(errors).toBeUndefined()
      expect(data.updatePayloadApiKey.apiKey).not.toBe(originalSecret)

      // Ownership must stay with Alice, not the administrator who triggered the
      // regeneration - checked via the local API, since asserting through a polymorphic
      // relationship union in the GraphQL response itself would just duplicate the
      // owner-preservation coverage already in the "regenerating a key" describe block.
      const regeneratedDoc = await payload.findByID({
        id: created.id,
        collection: payloadAPIKeysCollectionSlug,
        depth: 0,
        overrideAccess: true,
      })
      expect(regeneratedDoc.owner).toMatchObject({ relationTo: customersSlug, value: alice.id })
    })

    it('should not let a read-tier administrator regenerate another owner key via GraphQL', async () => {
      const alice = await createOwner(customersSlug)
      const readTierAdmin = await createOwner(adminsSlug, { apiKeyAccessLevel: 'canSee' })
      const created = await payload.create({
        collection: payloadAPIKeysCollectionSlug,
        data: { name: 'Alice key' },
        overrideAccess: false,
        user: alice,
      })
      createdKeyIDs.push(created.id)

      await restClient.login({
        slug: adminsSlug,
        credentials: { email: readTierAdmin.email, password: 'Password123!' },
      })

      const query = `mutation {
        updatePayloadApiKey(id: ${idToString(created.id, payload)}, data: { regenerate: true }) {
          apiKey
        }
      }`

      const response = await restClient.GRAPHQL_POST({ body: JSON.stringify({ query }) })
      const { errors } = await response.json()

      expect(errors?.[0]?.message).toBeTruthy()
    })
  })

  it('should leave collection-backed keys unaffected by rotateSecret, since they never depend on payload.secret', async () => {
    const alice = await createOwner(customersSlug)
    const key = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: { name: 'Alice key' },
      overrideAccess: false,
      user: alice,
    })
    createdKeyIDs.push(key.id)

    const beforeRaw = await payload.db.findOne<{ apiKeyHash: string }>({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: key.id } },
    })

    const result = await rotateSecret({ oldSecret: 'SOME_UNRELATED_OLD_SECRET', payload })

    const afterRaw = await payload.db.findOne<{ apiKeyHash: string }>({
      collection: payloadAPIKeysCollectionSlug,
      where: { id: { equals: key.id } },
    })
    expect(afterRaw!.apiKeyHash).toBe(beforeRaw!.apiKeyHash)
    expect(result.migrated).toBe(0)
  })
})
