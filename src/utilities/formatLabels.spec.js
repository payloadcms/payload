const formatLabels = require('./formatLabels');

describe('formatLabels', () => {
  it('should format single word', () => {
    expect(formatLabels('word')).toMatchObject({
      singular: 'Word',
      plural: 'Words',
    });
  });

  it('should format already plural', () => {
    expect(formatLabels('words')).toMatchObject({
      singular: 'Words',
      plural: 'Words',
    });
  });

  it('should format kebab case', () => {
    expect(formatLabels('kebab-item')).toMatchObject({
      singular: 'Kebab Item',
      plural: 'Kebab Items',
    });
  });

  it('should format camelCase', () => {
    expect(formatLabels('camelCaseItem')).toMatchObject({
      singular: 'Camel Case Item',
      plural: 'Camel Case Items',
    });
  });
});
