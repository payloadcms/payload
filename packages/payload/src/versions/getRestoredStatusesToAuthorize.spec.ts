import { describe, expect, it } from 'vitest'

import { getRestoredStatusesToAuthorize } from './getRestoredStatusesToAuthorize.js'

describe('getRestoredStatusesToAuthorize', () => {
  it('should return the scalar published status', () => {
    expect(getRestoredStatusesToAuthorize('published')).toStrictEqual(['published'])
  })

  it('should return the scalar draft status', () => {
    expect(getRestoredStatusesToAuthorize('draft')).toStrictEqual(['draft'])
  })

  it('should return a single published status when every locale is published', () => {
    expect(getRestoredStatusesToAuthorize({ de: 'published', en: 'published' })).toStrictEqual([
      'published',
    ])
  })

  it('should return a single draft status when every locale is draft', () => {
    expect(getRestoredStatusesToAuthorize({ de: 'draft', en: 'draft' })).toStrictEqual(['draft'])
  })

  it('should return both statuses for a mixed-locale object so each transition is authorized', () => {
    const result = getRestoredStatusesToAuthorize({ de: 'published', en: 'draft' })

    expect(result).toHaveLength(2)
    expect(result).toContain('draft')
    expect(result).toContain('published')
  })

  it('should return an empty array when the status is missing', () => {
    expect(getRestoredStatusesToAuthorize(undefined)).toStrictEqual([])
    expect(getRestoredStatusesToAuthorize(null)).toStrictEqual([])
  })

  it('should return an empty array for an array status shape', () => {
    expect(getRestoredStatusesToAuthorize(['published'])).toStrictEqual([])
  })
})
