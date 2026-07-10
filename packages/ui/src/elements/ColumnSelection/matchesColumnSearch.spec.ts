import { describe, expect, it } from 'vitest'

import { matchesColumnSearch } from './matchesColumnSearch.js'

describe('matchesColumnSearch', () => {
  it('matches everything when the query is empty', () => {
    expect(matchesColumnSearch({ labelText: 'Published Date', query: '' })).toBe(true)
  })

  it('matches everything when the query is only whitespace', () => {
    expect(matchesColumnSearch({ labelText: 'Published Date', query: '   ' })).toBe(true)
  })

  describe('single-character queries', () => {
    it('matches the start of the label', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'p' })).toBe(true)
    })

    it('matches the start of a later word', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'd' })).toBe(true)
    })

    it('matches the start of a word after a nested-label separator', () => {
      expect(matchesColumnSearch({ labelText: 'Meta > Title', query: 't' })).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'P' })).toBe(true)
    })

    it('does not match a character in the middle of a word', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'u' })).toBe(false)
    })

    it('returns false when no word starts with the character', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'z' })).toBe(false)
    })
  })

  describe('multi-character queries', () => {
    it('matches a substring in the middle of the label', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'ish' })).toBe(true)
    })

    it('matches across a word boundary', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'd da' })).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'DATE' })).toBe(true)
    })

    it('returns false when the substring is not present', () => {
      expect(matchesColumnSearch({ labelText: 'Published Date', query: 'zzz' })).toBe(false)
    })
  })
})
