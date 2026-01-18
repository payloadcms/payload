import { fieldAffectsData } from 'payload/shared';
const getRemainingColumns = (fields, useAsTitle) => fields?.reduce((remaining, field) => {
  if (fieldAffectsData(field) && field.name === useAsTitle) {
    return remaining;
  }
  if (!fieldAffectsData(field) && 'fields' in field) {
    return [...remaining, ...getRemainingColumns(field.fields, useAsTitle)];
  }
  if (field.type === 'tabs' && 'tabs' in field) {
    return [...remaining, ...field.tabs.reduce((tabFieldColumns, tab) => [...tabFieldColumns, ...('name' in tab ? [tab.name] : getRemainingColumns(tab.fields, useAsTitle))], [])];
  }
  return [...remaining, field.name];
}, []);
/**
 * Returns the initial columns to display in the table based on the following criteria:
 * 1. If `defaultColumns` is set in the collection config, use those columns
 * 2. Otherwise take `useAtTitle, if set, and the next 3 fields that are not hidden or disabled
 */
export const getInitialColumns = (fields, useAsTitle, defaultColumns) => {
  let initialColumns = [];
  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    initialColumns = defaultColumns;
  } else {
    if (useAsTitle) {
      initialColumns.push(useAsTitle);
    }
    const remainingColumns = getRemainingColumns(fields, useAsTitle);
    initialColumns = initialColumns.concat(remainingColumns);
    initialColumns = initialColumns.slice(0, 4);
  }
  return initialColumns.map(column => ({
    accessor: column,
    active: true
  }));
};
//# sourceMappingURL=getInitialColumns.js.map