/**
 * Formats an array of options for use in a select input.
 */export const formatOptions = options => options.map(option => {
  if (typeof option === 'object' && (option.value || option.value === '')) {
    return option;
  }
  return {
    label: option,
    value: option
  };
});
//# sourceMappingURL=formatOptions.js.map