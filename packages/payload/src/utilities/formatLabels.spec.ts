import { describe, it, expect } from 'vitest'
import { formatLabels, toWords } from './formatLabels'

describe('formatLabels', () => {
  it('should format singular slug', () => {
    expect(formatLabels('word')).toMatchObject({
      plural: 'Words',
      singular: 'Word',
    })
  })

  it('should format plural slug', () => {
    expect(formatLabels('words')).toMatchObject({
      plural: 'Words',
      singular: 'Word',
    })
  })

  it('should format kebab case', () => {
    expect(formatLabels('my-slugs')).toMatchObject({
      plural: 'My Slugs',
      singular: 'My Slug',
    })
  })

  it('should format camelCase', () => {
    expect(formatLabels('camelCaseItems')).toMatchObject({
      plural: 'Camel Case Items',
      singular: 'Camel Case Item',
    })
  })

  describe('toWords', () => {
    it('should convert camel to capitalized words', () => {
      expect(toWords('camelCaseItems')).toBe('Camel Case Items')
    })

    it('should allow no separator (used for building GraphQL label from name)', () => {
      expect(toWords('myGraphField', true)).toBe('MyGraphField')
    })

    it('should not throw on numeric input (Postgres relationship IDs from query presets)', () => {
      expect(toWords(5)).toBe('5')
    })

    it('should render an array of numeric IDs the way QueryPresetsWhereCell does', () => {
      expect([5, 12].map((val) => toWords(val)).join(' or ')).toBe('5 or 12')
    })

    it('should fall back to empty string for nullish input', () => {
      expect(toWords(null)).toBe('')
      expect(toWords(undefined)).toBe('')
    })
  })
})
