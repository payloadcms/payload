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
      { field: 'email', message: req.t('error:userEmailAlreadyRegistered') },
    ])
  }

  const { hash, salt } = await generatePasswordSaltHash({ password })

  const sanitizedDoc = { ...doc }
  if (sanitizedDoc.password) delete sanitizedDoc.password

  const dbArgs = {
    collection: collection.slug,
    data: {
      ...sanitizedDoc,
      hash,
      salt,
    },
    req,
  }
  if (collection?.db?.create) {
    return collection.db.create(dbArgs)
  } else {
    return payload.db.create(dbArgs)
  }
}
