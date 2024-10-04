import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, Payload } from '../../../index.js'
import type { PayloadRequest, Where } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { generatePasswordSaltHash } from './generatePasswordSaltHash.js'

type Args = {
  collection: SanitizedCollectionConfig
  doc: JsonObject
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
  const loginWithUsername = collection?.auth?.loginWithUsername

  let whereConstraint: Where

  if (!loginWithUsername) {
    whereConstraint = {
      email: {
        equals: doc.email,
      },
    }
  } else {
    whereConstraint = {
      or: [],
    }

    if (doc.email) {
      whereConstraint.or.push({
        email: {
          equals: doc.email,
        },
      })
    }

    if (doc.username) {
      whereConstraint.or.push({
        username: {
          equals: doc.username,
        },
      })
    }
  }

  const existingUser = await payload.find({
    collection: collection.slug,
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: whereConstraint,
  })

  if (existingUser.docs.length > 0) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        loginWithUsername
          ? {
              field: 'username',
              message: req.t('error:usernameAlreadyRegistered'),
            }
          : { field: 'email', message: req.t('error:userEmailAlreadyRegistered') },
      ],
    })
  }

  const { hash, salt } = await generatePasswordSaltHash({ collection, password, req })

  const sanitizedDoc = { ...doc }
  if (sanitizedDoc.password) {
    delete sanitizedDoc.password
  }

  const dbArgs = {
    collection: collection.slug,
    data: {
      ...sanitizedDoc,
      hash,
      salt,
    },
    req,
  }
  // @ts-expect-error exists
  if (collection?.db?.create) {
    // @ts-expect-error exists
    return collection.db.create(dbArgs)
  } else {
    return payload.db.create(dbArgs)
  }
}
