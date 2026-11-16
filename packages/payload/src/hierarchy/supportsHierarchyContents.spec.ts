import { expect, test } from 'vitest'

import { supportsHierarchyContents } from './supportsHierarchyContents.js'

test.each([
  { expected: false, hierarchy: undefined },
  { expected: false, hierarchy: true },
  { expected: false, hierarchy: false },
  { expected: false, hierarchy: {} },
  { expected: false, hierarchy: { allowHasMany: true } },
  { expected: true, hierarchy: { allowHasMany: false } },
  { expected: false, hierarchy: { allowHasMany: true }, tags: true },
  { expected: true, hierarchy: { allowHasMany: false }, tags: true },
  { expected: false, hierarchy: { allowHasMany: false }, nestedDocs: true },
  { expected: false, hierarchy: { allowHasMany: false }, nestedDocs: {} },
])(
  'should resolve mixed contents browsing capability for $hierarchy/$nestedDocs',
  ({ expected, ...collection }) => {
    expect(supportsHierarchyContents({ collection })).toBe(expected)
  },
)
