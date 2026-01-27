import crypto from 'crypto'

import { describe, expect, it } from 'vitest'

import { authenticateLocalStrategy } from './authenticate.js'

// Helper to generate hash/salt like Payload does
const generateHashAndSalt = (password: string): { hash: string; salt: string } => {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')
  return { hash, salt }
}

describe('authenticateLocalStrategy', () => {
  it('should return doc when password is valid', async () => {
    const password = 'test-password'
    const { hash, salt } = generateHashAndSalt(password)
    const doc = { id: 1, hash, salt }

    const result = await authenticateLocalStrategy({ doc, password })

    expect(result).toEqual(doc)
  })

  it('should return null when password is invalid', async () => {
    const { hash, salt } = generateHashAndSalt('correct-password')
    const doc = { id: 1, hash, salt }

    const result = await authenticateLocalStrategy({ doc, password: 'wrong-password' })

    expect(result).toBeNull()
  })

  it('should return null when salt is missing', async () => {
    const { hash } = generateHashAndSalt('test-password')
    const doc = { id: 1, hash }

    const result = await authenticateLocalStrategy({ doc, password: 'test-password' })

    expect(result).toBeNull()
  })

  it('should return null when hash is missing', async () => {
    const { salt } = generateHashAndSalt('test-password')
    const doc = { id: 1, salt }

    const result = await authenticateLocalStrategy({ doc, password: 'test-password' })

    expect(result).toBeNull()
  })

  it('should return null when hash has different length (tampered)', async () => {
    const password = 'test-password'
    const { salt } = generateHashAndSalt(password)
    // Truncated hash - different length than expected 512 bytes
    const shortHash = 'abcd1234'
    const doc = { id: 1, hash: shortHash, salt }

    const result = await authenticateLocalStrategy({ doc, password })

    expect(result).toBeNull()
  })
})
