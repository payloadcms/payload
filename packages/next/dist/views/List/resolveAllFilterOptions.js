import { resolveFilterOptions } from '@payloadcms/ui/rsc';
import { fieldAffectsData, fieldHasSubFields, fieldIsHiddenOrDisabled, tabHasName } from 'payload/shared';
export const resolveAllFilterOptions = async ({
  fields,
  pathPrefix,
  req,
  result
}) => {
  const resolvedFilterOptions = !result ? new Map() : result;
  await Promise.all(fields.map(async field => {
    if (fieldIsHiddenOrDisabled(field)) {
      return;
    }
    const fieldPath = fieldAffectsData(field) ? pathPrefix ? `${pathPrefix}.${field.name}` : field.name : pathPrefix;
    if ((field.type === 'relationship' || field.type === 'upload') && 'filterOptions' in field && field.filterOptions) {
      const options = await resolveFilterOptions(field.filterOptions, {
        id: undefined,
        blockData: undefined,
        data: {},
        relationTo: field.relationTo,
        req,
        siblingData: {},
        user: req.user
      });
      resolvedFilterOptions.set(fieldPath, options);
    }
    if (fieldHasSubFields(field)) {
      await resolveAllFilterOptions({
        fields: field.fields,
        pathPrefix: fieldPath,
        req,
        result: resolvedFilterOptions
      });
    }
    if (field.type === 'tabs') {
      await Promise.all(field.tabs.map(async tab => {
        const tabPath = tabHasName(tab) ? fieldPath ? `${fieldPath}.${tab.name}` : tab.name : fieldPath;
        await resolveAllFilterOptions({
          fields: tab.fields,
          pathPrefix: tabPath,
          req,
          result: resolvedFilterOptions
        });
      }));
    }
  }));
  return resolvedFilterOptions;
};
//# sourceMappingURL=resolveAllFilterOptions.js.map