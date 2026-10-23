import { expect, test } from 'vitest'

import { extractRelationshipID } from './extractRelationshipID.js'

test('should return string and number relationship IDs unchanged', () => {
  expect(extractRelationshipID({ relationship: 'post-1' })).toBe('post-1')
  expect(extractRelationshipID({ relationship: 42 })).toBe(42)
})

test('should extract an ID from a relationship value object', () => {
  expect(extractRelationshipID({ relationship: { value: 'post-1' } })).toBe('post-1')
  expect(extractRelationshipID({ relationship: { relationTo: 'posts', value: 42 } })).toBe(42)
})

test('should return undefined for values without a relationship ID', () => {
  expect(extractRelationshipID({ relationship: null })).toBeUndefined()
  expect(extractRelationshipID({ relationship: { id: 'post-1' } })).toBeUndefined()
  expect(extractRelationshipID({ relationship: { value: null } })).toBeUndefined()
})
