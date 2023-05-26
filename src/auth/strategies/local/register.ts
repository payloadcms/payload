import { ValidationError } from "../../../errors"
import { Payload } from '../../..'
import { SanitizedCollectionConfig } from '../../../collections/config/types'
import { generatePasswordSaltHash } from './generatePasswordSaltHash';

type Args = {
  collection: SanitizedCollectionConfig
  doc: Record<string, unknown>
  password: string
  payload: Payload
}

export const registerLocalStrategy = async ({
  collection,
  doc,
  password,
  payload,
}: Args): Promise<Record<string, unknown>> => {
  const existingUser = await payload.find({
    collection: collection.slug,
    depth: 0,
    where: {
      email: {
        equals: doc.email,
      }
    }
  })

  if (existingUser.docs.length > 0) {
    throw new ValidationError([{ message: 'A user with the given email is already registered', field: 'email' }])
  }

  const { salt, hash } = await generatePasswordSaltHash({ password })

  const result = await payload.collections[collection.slug].Model.create({
    ...doc,
    salt,
    hash
  })

  return result
}

