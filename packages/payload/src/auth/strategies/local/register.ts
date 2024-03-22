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
  const { hash, salt } = await generatePasswordSaltHash({ password })

  const sanitizedDoc = { ...doc }
  if (sanitizedDoc.password) delete sanitizedDoc.password

  try {
    return await payload.db.create({
      collection: collection.slug,
      data: {
        ...sanitizedDoc,
        hash,
        salt,
      },
      req,
    })
  } catch (error) {
    // Handle uniqueness error from MongoDB
    if (error.code === 11000 && error.keyValue) {
      error = new ValidationError(
        [
          {
            field: Object.keys(error.keyValue)[0],
            message: req.t('error:valueMustBeUnique'),
          },
        ],
        req.t,
      )
    }

    if (
      error instanceof ValidationError &&
      error.data[0].field === 'email' &&
      error.data[0].message === req.t('error:valueMustBeUnique')
    ) {
      error = new ValidationError(
        [
          { field: 'email', message: req.t('error:userWithEmailAlreadyExists') },
          ...error.data.slice(1),
        ],
        req.t,
      )
    }

    throw error
  }
}
