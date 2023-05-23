import { Field, fieldHasSubFields, fieldAffectsData, tabHasName } from '../../../../fields/config/types';

const getRemainingColumns = (fields: Field[], useAsTitle: string): string[] => fields.reduce((remaining, field) => {
  if (fieldAffectsData(field) && field.name === useAsTitle) {
    return remaining;
  }

  if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
    return [
      ...remaining,
      ...getRemainingColumns(field.fields, useAsTitle),
    ];
  }

  if (field.type === 'tabs') {
    return [
      ...remaining,
      ...field.tabs.reduce((tabFieldColumns, tab) => [
        ...tabFieldColumns,
        ...(tabHasName(tab) ? [tab.name] : getRemainingColumns(tab.fields, useAsTitle)),
      ], []),
    ];
  }

  return [
    ...remaining,
    field.name,
  ];
}, []);

const getInitialColumnState = (fields: Field[], useAsTitle: string, defaultColumns: string[]): string[] => {
  let initialColumns = [];

  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    return defaultColumns;
  }


  if (useAsTitle) {
    initialColumns.push(useAsTitle);
  }

  const remainingColumns = getRemainingColumns(fields, useAsTitle);

  initialColumns = initialColumns.concat(remainingColumns);
  initialColumns = initialColumns.slice(0, 4);

  return initialColumns;
};


export default getInitialColumnState;
