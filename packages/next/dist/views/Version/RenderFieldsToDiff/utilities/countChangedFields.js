import { fieldShouldBeLocalized, groupHasName } from 'payload/shared';
import { fieldHasChanges } from './fieldHasChanges.js';
import { getFieldsForRowComparison } from './getFieldsForRowComparison.js';
/**
 * Recursively counts the number of changed fields between comparison and
 * version data for a given set of fields.
 */
export function countChangedFields({
  config,
  fields,
  locales,
  parentIsLocalized,
  valueFrom,
  valueTo
}) {
  let count = 0;
  fields.forEach(field => {
    // Don't count the id field since it is not displayed in the UI
    if ('name' in field && field.name === 'id') {
      return;
    }
    const fieldType = field.type;
    switch (fieldType) {
      // Iterable fields are arrays and blocks fields. We iterate over each row and
      // count the number of changed fields in each.
      case 'array':
      case 'blocks':
        {
          if (locales && fieldShouldBeLocalized({
            field,
            parentIsLocalized
          })) {
            locales.forEach(locale => {
              const valueFromRows = valueFrom?.[field.name]?.[locale] ?? [];
              const valueToRows = valueTo?.[field.name]?.[locale] ?? [];
              count += countChangedFieldsInRows({
                config,
                field,
                locales,
                parentIsLocalized: parentIsLocalized || field.localized,
                valueFromRows,
                valueToRows
              });
            });
          } else {
            const valueFromRows = valueFrom?.[field.name] ?? [];
            const valueToRows = valueTo?.[field.name] ?? [];
            count += countChangedFieldsInRows({
              config,
              field,
              locales,
              parentIsLocalized: parentIsLocalized || field.localized,
              valueFromRows,
              valueToRows
            });
          }
          break;
        }
      // Regular fields without nested fields.
      case 'checkbox':
      case 'code':
      case 'date':
      case 'email':
      case 'join':
      case 'json':
      case 'number':
      case 'point':
      case 'radio':
      case 'relationship':
      case 'richText':
      case 'select':
      case 'text':
      case 'textarea':
      case 'upload':
        {
          // Fields that have a name and contain data. We can just check if the data has changed.
          if (locales && fieldShouldBeLocalized({
            field,
            parentIsLocalized
          })) {
            locales.forEach(locale => {
              if (fieldHasChanges(valueTo?.[field.name]?.[locale], valueFrom?.[field.name]?.[locale])) {
                count++;
              }
            });
          } else if (fieldHasChanges(valueTo?.[field.name], valueFrom?.[field.name])) {
            count++;
          }
          break;
        }
      // Fields that have nested fields, but don't nest their fields' data.
      case 'collapsible':
      case 'row':
        {
          count += countChangedFields({
            config,
            fields: field.fields,
            locales,
            parentIsLocalized: parentIsLocalized || field.localized,
            valueFrom,
            valueTo
          });
          break;
        }
      // Fields that have nested fields and nest their fields' data.
      case 'group':
        {
          if (groupHasName(field)) {
            if (locales && fieldShouldBeLocalized({
              field,
              parentIsLocalized
            })) {
              locales.forEach(locale => {
                count += countChangedFields({
                  config,
                  fields: field.fields,
                  locales,
                  parentIsLocalized: parentIsLocalized || field.localized,
                  valueFrom: valueFrom?.[field.name]?.[locale],
                  valueTo: valueTo?.[field.name]?.[locale]
                });
              });
            } else {
              count += countChangedFields({
                config,
                fields: field.fields,
                locales,
                parentIsLocalized: parentIsLocalized || field.localized,
                valueFrom: valueFrom?.[field.name],
                valueTo: valueTo?.[field.name]
              });
            }
          } else {
            // Unnamed group field: data is NOT nested under `field.name`
            count += countChangedFields({
              config,
              fields: field.fields,
              locales,
              parentIsLocalized: parentIsLocalized || field.localized,
              valueFrom,
              valueTo
            });
          }
          break;
        }
      // Each tab in a tabs field has nested fields. The fields data may be
      // nested or not depending on the existence of a name property.
      case 'tabs':
        {
          field.tabs.forEach(tab => {
            if ('name' in tab && locales && tab.localized) {
              // Named localized tab
              locales.forEach(locale => {
                count += countChangedFields({
                  config,
                  fields: tab.fields,
                  locales,
                  parentIsLocalized: parentIsLocalized || tab.localized,
                  valueFrom: valueFrom?.[tab.name]?.[locale],
                  valueTo: valueTo?.[tab.name]?.[locale]
                });
              });
            } else if ('name' in tab) {
              // Named tab
              count += countChangedFields({
                config,
                fields: tab.fields,
                locales,
                parentIsLocalized: parentIsLocalized || tab.localized,
                valueFrom: valueFrom?.[tab.name],
                valueTo: valueTo?.[tab.name]
              });
            } else {
              // Unnamed tab
              count += countChangedFields({
                config,
                fields: tab.fields,
                locales,
                parentIsLocalized: parentIsLocalized || tab.localized,
                valueFrom,
                valueTo
              });
            }
          });
          break;
        }
      // UI fields don't have data and are not displayed in the version view
      // so we can ignore them.
      case 'ui':
        {
          break;
        }
      default:
        {
          const _exhaustiveCheck = fieldType;
          throw new Error(`Unexpected field.type in countChangedFields : ${String(fieldType)}`);
        }
    }
  });
  return count;
}
export function countChangedFieldsInRows({
  config,
  field,
  locales,
  parentIsLocalized,
  valueFromRows = [],
  valueToRows = []
}) {
  let count = 0;
  let i = 0;
  while (valueFromRows[i] || valueToRows[i]) {
    const valueFromRow = valueFromRows?.[i] || {};
    const valueToRow = valueToRows?.[i] || {};
    const {
      fields: rowFields
    } = getFieldsForRowComparison({
      baseVersionField: {
        type: 'text',
        fields: [],
        path: '',
        schemaPath: ''
      },
      config,
      field,
      row: i,
      valueFromRow,
      valueToRow
    });
    count += countChangedFields({
      config,
      fields: rowFields,
      locales,
      parentIsLocalized: parentIsLocalized || field.localized,
      valueFrom: valueFromRow,
      valueTo: valueToRow
    });
    i++;
  }
  return count;
}
//# sourceMappingURL=countChangedFields.js.map