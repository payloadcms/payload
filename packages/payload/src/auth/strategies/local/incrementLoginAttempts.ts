import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js'
import type { JsonObject, Payload } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown> & TypeWithID
  payload: Payload
  req: PayloadRequest
}

export const incrementLoginAttempts = async ({
  collection,
  doc,
  payload,
  req,
}: Args): Promise<void> => {
  const {
    auth: { lockTime, maxLoginAttempts },
  } = collection

  if ('lockUntil' in doc && typeof doc.lockUntil === 'string') {
    const lockUntil = new Date(doc.lockUntil).getTime()

    // Expired lock, restart count at 1
    if (lockUntil < Date.now()) {
      await payload.update({
        id: doc.id,
        collection: collection.slug,
        data: {
          lockUntil: null,
          loginAttempts: 1,
        },
        depth: 0,
        req,
      })
    }

    return
  }

  const data: JsonObject = {
    loginAttempts: Number(doc.loginAttempts) + 1,
  }

  // Lock the account if at max attempts and not already locked
  if (typeof doc.loginAttempts === 'number' && doc.loginAttempts + 1 >= maxLoginAttempts) {
    const lockUntil = new Date(Date.now() + lockTime).toISOString()
    data.lockUntil = lockUntil
  }

  await payload.update({
    id: doc.id,
    collection: collection.slug,
    data,
    depth: 0,
    req,
  })
}
