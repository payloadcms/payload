import { describe, expect, it } from 'vitest'

import { getRelationshipGroupKey } from './getRelationshipGroupKey.js'

describe('getRelationshipGroupKey', () => {
  it('should distinguish collections that have matching labels', () => {
    const groups = [
      { label: 'Content', slug: 'posts' },
      { label: 'Content', slug: 'users' },
    ]

    expect(
      groups.map(({ slug }) => getRelationshipGroupKey({ fieldPath: 'relatedContent', slug })),
    ).toEqual(['relatedContent-posts', 'relatedContent-users'])
  })

  it('should use only the field path for an unresolved group', () => {
    const unresolvedKey = getRelationshipGroupKey({
      fieldPath: 'relatedContent',
      slug: undefined,
    })
    const collectionKey = getRelationshipGroupKey({ fieldPath: 'relatedContent', slug: 'unknown' })

    expect(unresolvedKey).toBe('relatedContent')
    expect(unresolvedKey).not.toBe(collectionKey)
  })
})
