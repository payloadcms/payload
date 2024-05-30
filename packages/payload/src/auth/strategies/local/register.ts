import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { Payload } from '../../../index.js'
import type { PayloadRequestWithData } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { generatePasswordSaltHash } from './generatePasswordSaltHash.js'

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  password: string
  payload: Payload
  req: PayloadRequestWithData
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
    limit: 1,
    pagination: false,
    req,
    where: {
      email: {
        equals: doc.email,
      },
    },
  })

  if (existingUser.docs.length > 0) {
    throw new ValidationError([
      { field: 'email', message: req.t('error:userEmailAlreadyRegistered') },
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
