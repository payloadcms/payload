import crypto from 'crypto'

import { describe, expect, it } from 'vitest'

import { authenticateLocalStrategy } from './authenticate.js'

const generateExistingHashAndSalt = (password: string): { hash: string; salt: string } => {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')
  return { hash, salt }
}

const generateCurrentHashAndSalt = (password: string): { hash: string; salt: string } => {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex')

  return { hash: `pbkdf2-sha256-v1:${hash}`, salt }
}

describe('authenticateLocalStrategy', () => {
  it('should return doc for an existing password hash', async () => {
    const password = 'test-password'
    const { hash, salt } = generateExistingHashAndSalt(password)
    const doc = { id: 1, hash, salt }

    const result = await authenticateLocalStrategy({ doc, password })

    expect(result).toEqual({ doc, shouldUpdatePasswordHash: true })
  })

  it('should return doc for a current password hash', async () => {
    const password = 'test-password'
    const { hash, salt } = generateCurrentHashAndSalt(password)
    const doc = { id: 1, hash, salt }

    const result = await authenticateLocalStrategy({ doc, password })

    expect(result).toEqual({ doc, shouldUpdatePasswordHash: false })
  })

  it('should return null when password is invalid', async () => {
    const { hash, salt } = generateExistingHashAndSalt('correct-password')
    const doc = { id: 1, hash, salt }

    const result = await authenticateLocalStrategy({ doc, password: 'wrong-password' })

    expect(result).toBeNull()
  })

  it('should return null when salt is missing', async () => {
    const { hash } = generateExistingHashAndSalt('test-password')
    const doc = { id: 1, hash }

    const result = await authenticateLocalStrategy({ doc, password: 'test-password' })

    expect(result).toBeNull()
  })

  it('should return null when hash is missing', async () => {
    const { salt } = generateExistingHashAndSalt('test-password')
    const doc = { id: 1, salt }

    const result = await authenticateLocalStrategy({ doc, password: 'test-password' })

    expect(result).toBeNull()
  })

  it('should return null when hash has different length (tampered)', async () => {
    const password = 'test-password'
    const { salt } = generateExistingHashAndSalt(password)
    // Truncated hash - different length than an existing hash derives
    const shortHash = 'abcd1234'
    const doc = { id: 1, hash: shortHash, salt }

    const result = await authenticateLocalStrategy({ doc, password })

    expect(result).toBeNull()
  })
})
