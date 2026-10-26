import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../../config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

import { InvalidConfiguration, ValidationError } from '../../../errors/index.js'
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

type PasswordHashIterations = SanitizedConfig['auth']['passwordHashIterations']

// Each supported iteration count has its own fixed prefix, so a stored hash
// can be verified whichever count is configured
const passwordHashPrefixes: Record<PasswordHashIterations, string> = {
  100000: 'pbkdf2-sha256-100k-v1:',
  600000: 'pbkdf2-sha256-v1:',
}
export const supportedPasswordHashIterations = Object.keys(passwordHashPrefixes).map(Number)
const passwordHashKeyLength = 32
const legacyPasswordHashIterations = 25000
const legacyPasswordHashKeyLength = 512

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

  const { passwordHashIterations } = req.payload.config.auth
  const saltBuffer = await randomBytes()
  const salt = saltBuffer.toString('hex')

  const hashRaw = await pbkdf2Promisified({
    iterations: passwordHashIterations,
    keyLength: passwordHashKeyLength,
    password: passwordToSet,
    salt,
  }).catch((err: unknown) => {
    // Environments such as Cloudflare Workers reject iteration counts above their limit
    if (err instanceof Error && err.name === 'NotSupportedError') {
      throw new InvalidConfiguration(
        `This environment does not support ${passwordHashIterations} PBKDF2 iterations for password hashing. Set \`auth.passwordHashIterations\` to 100000 in your Payload Config.`,
      )
    }

    throw err
  })
  const hash = `${passwordHashPrefixes[passwordHashIterations]}${hashRaw.toString('hex')}`

  return { hash, salt }
}

export const getPasswordHashParameters = (hash: string): PasswordHashParameters => {
  for (const [iterations, prefix] of Object.entries(passwordHashPrefixes)) {
    if (hash.startsWith(prefix)) {
      return {
        hash: hash.slice(prefix.length),
        iterations: Number(iterations),
        keyLength: passwordHashKeyLength,
      }
    }
  }

  return {
    hash,
    iterations: legacyPasswordHashIterations,
    keyLength: legacyPasswordHashKeyLength,
  }
}

export const isCurrentPasswordHash = ({
  hash,
  passwordHashIterations,
}: {
  hash: string
  passwordHashIterations: PasswordHashIterations
}): boolean => hash.startsWith(passwordHashPrefixes[passwordHashIterations])

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
