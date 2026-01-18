'use client';

export const findOptionsByValue = ({
  allowEdit,
  options,
  value
}) => {
  if (value || typeof value === 'number') {
    if (Array.isArray(value)) {
      return value.map(val => {
        let matchedOption;
        options.forEach(optGroup => {
          if (!matchedOption) {
            matchedOption = optGroup.options.find(option => {
              return option.value === val.value && option.relationTo === val.relationTo;
            });
          }
        });
        return matchedOption ? {
          allowEdit,
          ...matchedOption
        } : undefined;
      });
    }
    let matchedOption;
    options.forEach(optGroup => {
      if (!matchedOption) {
        matchedOption = optGroup.options.find(option => {
          return option.value === value.value && option.relationTo === value.relationTo;
        });
      }
    });
    return matchedOption ? {
      allowEdit,
      ...matchedOption
    } : undefined;
  }
  return undefined;
};
//# sourceMappingURL=findOptionsByValue.js.map