import { describe, expect, it } from 'vitest'

import { isValidID } from './isValidID.js'

const hex = '507f1f77bcf86cd799439011'

// Shaped like a driver ObjectId, which is what a relationship value holds when read from MongoDB
const objectIdLike = { toHexString: () => hex }

describe('isValidID', () => {
  describe('ObjectID', () => {
    it('should accept a 24-character hex string', () => {
      expect(isValidID(hex, 'ObjectID')).toBe(true)
      expect(isValidID(hex.toUpperCase(), 'ObjectID')).toBe(true)
    })

    it('should accept an ObjectId-like object', () => {
      expect(isValidID(objectIdLike, 'ObjectID')).toBe(true)
    })

    it('should accept an ObjectId-like relationship value', () => {
      const relationship = { relationTo: 'posts', value: objectIdLike }

      expect(isValidID(relationship.value, 'ObjectID')).toBe(true)
    })

    it('should reject anything else', () => {
      expect(isValidID('not-an-id', 'ObjectID')).toBe(false)
      expect(isValidID({ toHexString: () => 'not-an-id' }, 'ObjectID')).toBe(false)
      expect(isValidID({}, 'ObjectID')).toBe(false)
      expect(isValidID(123, 'ObjectID')).toBe(false)
      expect(isValidID(null, 'ObjectID')).toBe(false)
    })
  })

  describe('text', () => {
    it('should accept any non-empty string', () => {
      expect(isValidID('custom-id', 'text')).toBe(true)
      expect(isValidID(hex, 'text')).toBe(true)
    })

    it('should accept an ObjectId-like object', () => {
      expect(isValidID(objectIdLike, 'text')).toBe(true)
    })

    it('should reject empty and non-ID values', () => {
      expect(isValidID('', 'text')).toBe(false)
      expect(isValidID({}, 'text')).toBe(false)
      expect(isValidID(123, 'text')).toBe(false)
    })
  })

  describe('number', () => {
    it('should accept numbers', () => {
      expect(isValidID(1, 'number')).toBe(true)
      expect(isValidID(0, 'number')).toBe(true)
    })

    it('should reject NaN and non-numbers', () => {
      expect(isValidID(Number.NaN, 'number')).toBe(false)
      expect(isValidID('1', 'number')).toBe(false)
      expect(isValidID(objectIdLike, 'number')).toBe(false)
    })
  })
})
