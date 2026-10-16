import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/index.js'
import { password } from '../../../fields/validations.js'

type PasswordHashParameters = {
  hash: string
  iterations: number
  keyLength: number
}

type Args = {
  collection: SanitizedCollectionConfig
  isPasswordAuthenticated?: boolean
  password: string
  req: PayloadRequest
}

const defaultPasswordHashIterations = 600000
const currentPasswordHashKeyLength = 32

// Hashes created before the parameters were embedded in the hash itself. They
// were always generated with these parameters, so verification keeps using
// them.
const legacyV1PasswordHashPrefix = 'pbkdf2-sha256-v1:'
const legacyV1PasswordHashIterations = 600000
const legacyV1PasswordHashKeyLength = 32

const legacyPasswordHashIterations = 25000
const legacyPasswordHashKeyLength = 512

// Cloudflare Workers rejects PBKDF2 iteration counts above 100,000, so cap
// iterations when running in the Workers runtime. Everywhere else keeps the
// stronger default.
const cloudflareWorkersMaxPBKDF2Iterations = 100000
const isCloudflareWorkersRuntime =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

const currentPasswordHashIterations = isCloudflareWorkersRuntime
  ? Math.min(defaultPasswordHashIterations, cloudflareWorkersMaxPBKDF2Iterations)
  : defaultPasswordHashIterations

// The parameters a hash was created with are embedded in the hash itself so
// verification does not depend on which runtime created it:
// pbkdf2-sha256-v2-i<iterations>-l<keyLength>:<hex>
const currentPasswordHashRegex = /^pbkdf2-sha256-v2-i(\d+)-l(\d+):([0-9a-f]+)$/

export const generatePasswordSaltHash = async ({
  collection,
  isPasswordAuthenticated,
  password: passwordToSet,
  req,
}: Args): Promise<{ hash: string; salt: string }> => {
  if (!isPasswordAuthenticated) {
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
  }

  const saltBuffer = await randomBytes()
  const salt = saltBuffer.toString('hex')

  const hashRaw = await pbkdf2Promisified({
    iterations: currentPasswordHashIterations,
    keyLength: currentPasswordHashKeyLength,
    password: passwordToSet,
    salt,
  })
  const hash = `pbkdf2-sha256-v2-i${currentPasswordHashIterations}-l${currentPasswordHashKeyLength}:${hashRaw.toString('hex')}`

  return { hash, salt }
}

export const getPasswordHashParameters = (hash: string): PasswordHashParameters => {
  const [, iterations, keyLength, storedHash] = currentPasswordHashRegex.exec(hash) ?? []

  if (iterations && keyLength && storedHash) {
    return {
      hash: storedHash,
      iterations: Number(iterations),
      keyLength: Number(keyLength),
    }
  }

  if (hash.startsWith(legacyV1PasswordHashPrefix)) {
    return {
      hash: hash.slice(legacyV1PasswordHashPrefix.length),
      iterations: legacyV1PasswordHashIterations,
      keyLength: legacyV1PasswordHashKeyLength,
    }
  }

  return {
    hash,
    iterations: legacyPasswordHashIterations,
    keyLength: legacyPasswordHashKeyLength,
  }
}

export const isCurrentPasswordHash = (hash: unknown): hash is string =>
  typeof hash === 'string' && currentPasswordHashRegex.test(hash)

function randomBytes(): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.randomBytes(32, (err, saltBuffer) => (err ? reject(err) : resolve(saltBuffer))),
  )
}

function pbkdf2Promisified({
  iterations,
  keyLength,
  password,
  salt,
}: {
  iterations: number
  keyLength: number
  password: string
  salt: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, iterations, keyLength, 'sha256', (err, hashRaw) =>
      err ? reject(err) : resolve(hashRaw),
    ),
  )
}
