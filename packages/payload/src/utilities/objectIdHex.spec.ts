import { describe, expect, it } from 'vitest'

import { isValidID } from './isValidID.js'
import { generateObjectIdHex, getObjectIdHex, isValidObjectIdHex } from './objectIdHex.js'

describe('objectIdHex', () => {
  describe('generateObjectIdHex', () => {
    it('should produce a 24-character lowercase hex string', () => {
      const id = generateObjectIdHex()
      expect(id).toHaveLength(24)
      expect(id).toMatch(/^[0-9a-f]{24}$/)
    })

    it('should produce unique values across many calls', () => {
      const seen = new Set<string>()
      for (let i = 0; i < 100_000; i++) {
        seen.add(generateObjectIdHex())
      }
      expect(seen.size).toBe(100_000)
    })

    it('should encode the current timestamp in the first 4 bytes', () => {
      const before = Math.floor(Date.now() / 1000)
      const id = generateObjectIdHex()
      const after = Math.floor(Date.now() / 1000)

      const time = parseInt(id.slice(0, 8), 16)
      expect(time).toBeGreaterThanOrEqual(before)
      expect(time).toBeLessThanOrEqual(after)
    })
  })

  describe('isValidObjectIdHex', () => {
    it('should accept 24-character hex strings (mixed case)', () => {
      expect(isValidObjectIdHex('507f1f77bcf86cd799439011')).toBe(true)
      expect(isValidObjectIdHex('507F1F77BCF86CD799439011')).toBe(true)
    })

    it('should accept generated ids', () => {
      expect(isValidObjectIdHex(generateObjectIdHex())).toBe(true)
    })

    it('should reject strings of the wrong length', () => {
      expect(isValidObjectIdHex('507f1f77bcf86cd79943901')).toBe(false)
      expect(isValidObjectIdHex('507f1f77bcf86cd7994390111')).toBe(false)
      expect(isValidObjectIdHex('')).toBe(false)
    })

    it('should reject strings with non-hex characters', () => {
      expect(isValidObjectIdHex('507f1f77bcf86cd79943901z')).toBe(false)
      expect(isValidObjectIdHex('507f1f77-cf86cd799439011')).toBe(false)
    })

    it('should accept ObjectId-like values with valid hex strings', () => {
      const objectId = { toHexString: () => '507f1f77bcf86cd799439011' }

      expect(isValidObjectIdHex(objectId)).toBe(true)
      expect(getObjectIdHex(objectId)).toBe('507f1f77bcf86cd799439011')
      expect(isValidID(objectId, 'ObjectID')).toBe(true)
    })

    it('should reject invalid values', () => {
      expect(isValidObjectIdHex(undefined)).toBe(false)
      expect(isValidObjectIdHex(null)).toBe(false)
      expect(isValidObjectIdHex(123)).toBe(false)
      expect(isValidObjectIdHex({})).toBe(false)
      expect(isValidObjectIdHex([])).toBe(false)
      expect(isValidObjectIdHex({ toHexString: () => 'invalid' })).toBe(false)
      expect(isValidID({ toHexString: () => 'invalid' }, 'ObjectID')).toBe(false)
    })
  })
})
