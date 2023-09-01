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
  })
})
