import type { Payload } from 'payload'

import crypto from 'crypto'
import path from 'path'
import { migrateAPIKeys, payloadAPIKeysCollectionSlug } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { customersSlug, otherCustomersSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const createdOwnerIDs: Array<{ collection: string; id: number | string }> = []
const createdKeyIDs: Array<number | string> = []
let ownerCounter = 0

const createLegacyOwner = async (
  collection: string,
  data: Record<string, unknown> = {},
): Promise<{ id: number | string }> => {
  ownerCounter += 1
  const owner = await payload.create({
    collection,
    data: {
      email: `legacy-owner-${collection}-${ownerCounter}@example.com`,
      password: 'Password123!',
      ...data,
    },
  })
  createdOwnerIDs.push({ collection, id: owner.id })
  return owner
}

// payload.secret is already the derived legacy key (see auth/crypto.ts), so this hashes
// it directly rather than re-deriving from a raw PAYLOAD_SECRET string.
const indexForActiveSecret = (rawApiKey: string) =>
  crypto.createHmac('sha256', payload.secret).update(rawApiKey).digest('hex')

/** Writes raw legacy apiKey/apiKeyIndex material at the DB layer, bypassing field hooks. */
const seedActiveLegacyRow = async ({
  collection,
  id,
  rawApiKey,
}: {
  collection: string
  id: number | string
  rawApiKey: string
}) => {
  await payload.db.updateOne({
    id,
    collection,
    data: {
      apiKey: payload.encrypt(rawApiKey),
      apiKeyIndex: indexForActiveSecret(rawApiKey),
      enableAPIKey: true,
    },
    returning: false,
  })
}

const seedDisabledLegacyRow = async ({
  collection,
  id,
  rawApiKey,
}: {
  collection: string
  id: number | string
  rawApiKey: string
}) => {
  await payload.db.updateOne({
    id,
    collection,
    data: {
      apiKey: payload.encrypt(rawApiKey),
      apiKeyIndex: null,
      enableAPIKey: false,
    },
    returning: false,
  })
}

describe('migrateAPIKeys', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
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

  it('should perform no writes on a dry run', async () => {
    const owner = await createLegacyOwner(customersSlug)
    const rawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    const result = await migrateAPIKeys({
      collections: [customersSlug],
      dryRun: true,
      payload,
    })

    expect(result.migrated).toBeGreaterThanOrEqual(1)

    const rawOwner = await payload.db.findOne<{ apiKeyIndex: string }>({
      collection: customersSlug,
      where: { id: { equals: owner.id } },
    })
    expect(rawOwner!.apiKeyIndex).toBe(indexForActiveSecret(rawApiKey))

    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    expect(migratedDocs.docs).toHaveLength(0)
  })

  it('should migrate an active legacy row into a working collection-mode key', async () => {
    const owner = await createLegacyOwner(customersSlug)
    const rawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    const result = await migrateAPIKeys({ collections: [customersSlug], payload })

    expect(result.migrated).toBe(1)
    expect(result.scrubbed).toBe(0)

    const rawOwnerAfter = await payload.db.findOne<{
      apiKey: null | string
      apiKeyIndex: null | string
      enableAPIKey: boolean
    }>({
      collection: customersSlug,
      where: { id: { equals: owner.id } },
    })
    expect(rawOwnerAfter!.apiKey).toBeFalsy()
    expect(rawOwnerAfter!.apiKeyIndex).toBeFalsy()
    expect(rawOwnerAfter!.enableAPIKey).toBeFalsy()

    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    expect(migratedDocs.docs).toHaveLength(1)
    createdKeyIDs.push(migratedDocs.docs[0]!.id)
    expect(migratedDocs.docs[0]!.name).toBe('Migrated API key')

    const { user } = await payload.auth({
      headers: new Headers({ Authorization: `${customersSlug} API-Key ${rawApiKey}` }),
    })
    expect(user?.id).toBe(owner.id)
  })

  it('should scrub a disabled legacy row without creating a key', async () => {
    const owner = await createLegacyOwner(customersSlug)
    const rawApiKey = crypto.randomUUID()
    await seedDisabledLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    const result = await migrateAPIKeys({ collections: [customersSlug], payload })

    expect(result.scrubbed).toBe(1)
    expect(result.migrated).toBe(0)

    const rawOwnerAfter = await payload.db.findOne<{ apiKey: null | string }>({
      collection: customersSlug,
      where: { id: { equals: owner.id } },
    })
    expect(rawOwnerAfter!.apiKey).toBeFalsy()

    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    expect(migratedDocs.docs).toHaveLength(0)
  })

  it('should be a no-op when rerun after a completed migration', async () => {
    const owner = await createLegacyOwner(customersSlug)
    const rawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    await migrateAPIKeys({ collections: [customersSlug], payload })
    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    createdKeyIDs.push(migratedDocs.docs[0]!.id)

    const secondRun = await migrateAPIKeys({ collections: [customersSlug], payload })

    expect(secondRun.migrated).toBe(0)
    expect(secondRun.scrubbed).toBe(0)

    const stillOneTarget = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    expect(stillOneTarget.docs).toHaveLength(1)
  })

  it('should resume without duplicating when the source was not cleared after a verified target exists', async () => {
    const owner = await createLegacyOwner(customersSlug)
    const rawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    await migrateAPIKeys({ collections: [customersSlug], payload })
    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    createdKeyIDs.push(migratedDocs.docs[0]!.id)

    // Simulate an interruption that created the target but never cleared the source.
    await seedActiveLegacyRow({ collection: customersSlug, id: owner.id, rawApiKey })

    const resumedRun = await migrateAPIKeys({ collections: [customersSlug], payload })

    expect(resumedRun.migrated).toBe(0)
    expect(resumedRun.skipped).toBe(1)

    const stillOneTarget = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(owner.id) } },
    })
    expect(stillOneTarget.docs).toHaveLength(1)

    const rawOwnerAfter = await payload.db.findOne<{ apiKeyIndex: null | string }>({
      collection: customersSlug,
      where: { id: { equals: owner.id } },
    })
    expect(rawOwnerAfter!.apiKeyIndex).toBeFalsy()
  })

  it('should fail the whole run closed on a corrupt row, leaving a valid row in the same batch untouched', async () => {
    const validOwner = await createLegacyOwner(customersSlug)
    const validRawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({
      collection: customersSlug,
      id: validOwner.id,
      rawApiKey: validRawApiKey,
    })

    const corruptOwner = await createLegacyOwner(customersSlug)
    await payload.db.updateOne({
      id: corruptOwner.id,
      collection: customersSlug,
      data: {
        apiKey: payload.encrypt(crypto.randomUUID()),
        apiKeyIndex: 'this-index-matches-no-secret',
        enableAPIKey: true,
      },
      returning: false,
    })

    await expect(migrateAPIKeys({ collections: [customersSlug], payload })).rejects.toThrow(
      /could not verify apiKey/,
    )

    const rawValidOwnerAfter = await payload.db.findOne<{ apiKeyIndex: null | string }>({
      collection: customersSlug,
      where: { id: { equals: validOwner.id } },
    })
    expect(rawValidOwnerAfter!.apiKeyIndex).toBe(indexForActiveSecret(validRawApiKey))

    const migratedDocs = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(validOwner.id) } },
    })
    expect(migratedDocs.docs).toHaveLength(0)
  })

  it('should only migrate the collections explicitly requested', async () => {
    const includedOwner = await createLegacyOwner(customersSlug)
    const excludedOwner = await createLegacyOwner(otherCustomersSlug)
    const includedRawApiKey = crypto.randomUUID()
    const excludedRawApiKey = crypto.randomUUID()
    await seedActiveLegacyRow({
      collection: customersSlug,
      id: includedOwner.id,
      rawApiKey: includedRawApiKey,
    })
    await seedActiveLegacyRow({
      collection: otherCustomersSlug,
      id: excludedOwner.id,
      rawApiKey: excludedRawApiKey,
    })

    const result = await migrateAPIKeys({ collections: [customersSlug], payload })
    expect(result.migrated).toBe(1)

    const includedTarget = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(includedOwner.id) } },
    })
    expect(includedTarget.docs).toHaveLength(1)
    createdKeyIDs.push(includedTarget.docs[0]!.id)

    const excludedTarget = await payload.db.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { 'migratedFrom.documentID': { equals: String(excludedOwner.id) } },
    })
    expect(excludedTarget.docs).toHaveLength(0)

    const rawExcludedOwner = await payload.db.findOne<{ apiKeyIndex: null | string }>({
      collection: otherCustomersSlug,
      where: { id: { equals: excludedOwner.id } },
    })
    expect(rawExcludedOwner!.apiKeyIndex).toBe(indexForActiveSecret(excludedRawApiKey))
  })
})
