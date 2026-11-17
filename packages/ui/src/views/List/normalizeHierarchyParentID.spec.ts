import { expect, test, vi } from 'vitest'

import { normalizeHierarchyParentID } from './normalizeHierarchyParentID.js'

vi.mock('payload', () => ({ APIError: class extends Error {} }))

test.each([null, undefined, ''])('should treat only the empty parent %s as root', (value) => {
  expect(normalizeHierarchyParentID({ value })).toBeNull()
})

test.each([0, '0', 'null', 'undefined', 'a-document'])(
  'should preserve the valid custom parent ID %s',
  (value) => {
    expect(normalizeHierarchyParentID({ value })).toBe(value)
  },
)

test.each([[], ['a'], {}, false])('should reject a nonscalar hierarchy parent %j', (value) => {
  expect(() => normalizeHierarchyParentID({ value })).toThrow('Invalid hierarchy parent ID.')
})
