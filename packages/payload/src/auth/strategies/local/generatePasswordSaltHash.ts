import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { password } from '../../../fields/validations.js'

function randomBytes(): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.randomBytes(32, (err, saltBuffer) => (err ? reject(err) : resolve(saltBuffer))),
  )
}

function pbkdf2Promisified(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashRaw) =>
      err ? reject(err) : resolve(hashRaw),
    ),
  )
}

type Args = {
  collection: SanitizedCollectionConfig
  password: string
  req: PayloadRequest
}

export const generatePasswordSaltHash = async ({
  collection,
  password: passwordToSet,
  req,
}: Args): Promise<{ hash: string; salt: string }> => {
  const validationResult = password(passwordToSet, {
    name: 'password',
    type: 'text',
    blockData: {},
    data: {},
    event: 'submit',
    path: ['password'],
    preferences: { fields: {} },
    req,
    required: true,
    siblingData: {},
  })

  if (typeof validationResult === 'string') {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [{ message: validationResult, path: 'password' }],
    })
  }

  const saltBuffer = await randomBytes()
  const salt = saltBuffer.toString('hex')

  const hashRaw = await pbkdf2Promisified(passwordToSet, salt)
  const hash = hashRaw.toString('hex')

  return { hash, salt }
}
