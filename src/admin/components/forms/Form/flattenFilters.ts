const flattenFilters = [{
  test: (_: string, value: unknown): boolean => {
    const hasValidProperty = Object.prototype.hasOwnProperty.call(value, 'valid');
    const hasValueProperty = Object.prototype.hasOwnProperty.call(value, 'value');

    return (hasValidProperty && hasValueProperty);
  },
}];

export default flattenFilters;
