import { fieldIsHiddenOrDisabled, fieldIsID } from 'payload/shared';
/**
 * Filters fields that are hidden, disabled, or have `disableListColumn` set to `true`.
 * Recurses through `tabs` and any container with `.fields` (e.g., `row`, `group`, `collapsible`).
 */
export const filterFields = incomingFields => {
  const shouldSkipField = field => field.type !== 'ui' && fieldIsHiddenOrDisabled(field) && !fieldIsID(field) || field?.admin?.disableListColumn === true;
  return (incomingFields ?? []).reduce((acc, field) => {
    if (shouldSkipField(field)) {
      return acc;
    }
    // handle tabs
    if (field.type === 'tabs' && 'tabs' in field) {
      const formattedField = {
        ...field,
        tabs: field.tabs.map(tab => ({
          ...tab,
          fields: filterFields(tab.fields)
        }))
      };
      acc.push(formattedField);
      return acc;
    }
    // handle fields with subfields (row, group, collapsible, etc.)
    if ('fields' in field && Array.isArray(field.fields)) {
      const formattedField = {
        ...field,
        fields: filterFields(field.fields)
      };
      acc.push(formattedField);
      return acc;
    }
    // leaf
    acc.push(field);
    return acc;
  }, []);
};
//# sourceMappingURL=filterFields.js.map