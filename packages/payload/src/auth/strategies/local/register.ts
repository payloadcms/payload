import type { Payload } from '../../..'
import type { SanitizedCollectionConfig } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import { ValidationError } from '../../../errors'
import { generatePasswordSaltHash } from './generatePasswordSaltHash'

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  password: string
  payload: Payload
  req: PayloadRequest
}

export const registerLocalStrategy = async ({
  collection,
  doc,
  password,
  payload,
  req,
}: Args): Promise<Record<string, unknown>> => {
  const existingUser = await payload.find({
    collection: collection.slug,
    depth: 0,
    req,
    where: {
      email: {
        equals: doc.email,
      },
    },
  })

  if (existingUser.docs.length > 0) {
    throw new ValidationError([
      { field: 'email', message: 'A user with the given email is already registered' },
    ])
  }

  const { hash, salt } = await generatePasswordSaltHash({ password })

  const sanitizedDoc = { ...doc }
  if (sanitizedDoc.password) delete sanitizedDoc.password

  return payload.db.create({
    collection: collection.slug,
    data: {
      ...sanitizedDoc,
      hash,
      salt,
    },
    req,
  })
}
