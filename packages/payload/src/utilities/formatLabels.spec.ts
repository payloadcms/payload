import { formatLabels, toWords } from './formatLabels';

describe('formatLabels', () => {
  it('should format singular slug', () => {
    expect(formatLabels('word')).toMatchObject({
      singular: 'Word',
      plural: 'Words',
    });
  });

  it('should format plural slug', () => {
    expect(formatLabels('words')).toMatchObject({
      singular: 'Word',
      plural: 'Words',
    });
  });

  it('should format kebab case', () => {
    expect(formatLabels('my-slugs')).toMatchObject({
      singular: 'My Slug',
      plural: 'My Slugs',
    });
  });

  it('should format camelCase', () => {
    expect(formatLabels('camelCaseItems')).toMatchObject({
      singular: 'Camel Case Item',
      plural: 'Camel Case Items',
    });
  });

  describe('toWords', () => {
    it('should convert camel to capitalized words', () => {
      expect(toWords('camelCaseItems')).toBe('Camel Case Items');
    });

    it('should allow no separator (used for building GraphQL label from name)', () => {
      expect(toWords('myGraphField', true)).toBe('MyGraphField');
    });
  });
});
