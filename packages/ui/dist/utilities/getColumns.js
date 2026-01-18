import { flattenTopLevelFields } from 'payload';
import { fieldAffectsData } from 'payload/shared';
import { filterFieldsWithPermissions } from '../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js';
import { getInitialColumns } from '../providers/TableColumns/getInitialColumns.js';
export const getColumns = ({
  clientConfig,
  collectionConfig,
  collectionSlug,
  columns,
  i18n,
  permissions
}) => {
  const isPolymorphic = Array.isArray(collectionSlug);
  const fields = !isPolymorphic ? collectionConfig?.fields ?? [] : [];
  if (isPolymorphic) {
    for (const collection of collectionSlug) {
      const clientCollectionConfig = clientConfig.collections.find(each => each.slug === collection);
      for (const field of filterFieldsWithPermissions({
        fieldPermissions: permissions?.collections?.[collection]?.fields || true,
        fields: clientCollectionConfig.fields
      })) {
        if (fieldAffectsData(field)) {
          if (fields.some(each => fieldAffectsData(each) && each.name === field.name)) {
            continue;
          }
        }
        fields.push(field);
      }
    }
  }
  return columns ? columns?.filter(column => flattenTopLevelFields(fields, {
    i18n,
    keepPresentationalFields: true,
    moveSubFieldsToTop: true
  })?.some(field => {
    const accessor = 'accessor' in field ? field.accessor : 'name' in field ? field.name : undefined;
    return accessor === column.accessor;
  })) : getInitialColumns(isPolymorphic ? fields : filterFieldsWithPermissions({
    fieldPermissions: typeof collectionSlug === 'string' && permissions?.collections?.[collectionSlug]?.fields ? permissions.collections[collectionSlug].fields : true,
    fields
  }), collectionConfig?.admin?.useAsTitle, isPolymorphic ? [] : collectionConfig?.admin?.defaultColumns);
};
//# sourceMappingURL=getColumns.js.map