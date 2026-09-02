import type { BeforeDeleteHook } from '../../collections/config/types.js'

import { payloadAPIKeysCollectionSlug } from './config.js'

/**
 * Deletes every `payload-api-keys` document owned by the auth document being deleted.
 * Registered as `beforeDelete` (not `afterDelete`) so a cleanup failure aborts the owner
 * deletion instead of leaving an orphaned owner with its keys already gone - the design
 * never lets an owner deletion silently retain credential ciphertext. Reuses `req` so the
 * cleanup shares the caller's transaction where the adapter supports one, and runs for
 * both single and bulk delete since Payload invokes collection `beforeDelete` hooks per
 * matched document in both operations.
 */
export const deleteOwnerAPIKeysBeforeDelete: BeforeDeleteHook = async ({ id, collection, req }) => {
  await req.payload.delete({
    collection: payloadAPIKeysCollectionSlug,
    overrideAccess: true,
    req,
    where: {
      and: [{ 'owner.relationTo': { equals: collection.slug } }, { 'owner.value': { equals: id } }],
    },
  })
}
