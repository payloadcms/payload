import { describe, expect, it } from 'vitest'

import { matchesSearchQuery } from './matchesSearchQuery.js'

describe('matchesSearchQuery', () => {
  it('matches everything when the query is empty', () => {
    expect(matchesSearchQuery({ label: 'Published Date', query: '' })).toBe(true)
  })

  it('matches everything when the query is only whitespace', () => {
    expect(matchesSearchQuery({ label: 'Published Date', query: '   ' })).toBe(true)
  })

  describe('single-character queries', () => {
    it('matches the start of the label', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'p' })).toBe(true)
    })

    it('matches the start of a later word', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'd' })).toBe(true)
    })

    it('matches the start of a word after a nested-label separator', () => {
      expect(matchesSearchQuery({ label: 'Meta > Title', query: 't' })).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'P' })).toBe(true)
    })

    it('does not match a character in the middle of a word', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'u' })).toBe(false)
    })

    it('returns false when no word starts with the character', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'z' })).toBe(false)
    })

    it('matches the start of a non-Latin label', () => {
      expect(matchesSearchQuery({ label: 'Пользователь', query: 'п' })).toBe(true)
    })
  })

  describe('multi-character queries', () => {
    it('matches a substring in the middle of the label', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'ish' })).toBe(true)
    })

    it('matches across a word boundary', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'd da' })).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'DATE' })).toBe(true)
    })

    it('returns false when the substring is not present', () => {
      expect(matchesSearchQuery({ label: 'Published Date', query: 'zzz' })).toBe(false)
    })
  })
})
