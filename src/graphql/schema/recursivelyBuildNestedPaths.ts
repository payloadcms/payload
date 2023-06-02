import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  FieldWithSubFields,
  TabsField,
} from '../../fields/config/types';
import fieldToSchemaMap from './fieldToWhereInputSchemaMap';

const recursivelyBuildNestedPaths = (parentName: string, nestedFieldName2: string, field: FieldWithSubFields | TabsField) => {
  const fieldName = fieldAffectsData(field) ? field.name : undefined;
  const nestedFieldName = fieldName || nestedFieldName2;

  if (field.type === 'tabs') {
    // if the tab has a name, treat it as a group
    // otherwise, treat it as a row
    return field.tabs.reduce((tabSchema, tab: any) => {
      tabSchema.push(...recursivelyBuildNestedPaths(parentName, nestedFieldName, {
        ...tab,
        type: 'name' in tab ? 'group' : 'row',
      }));
      return tabSchema;
    }, []);
  }

  const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
    if (!fieldIsPresentationalOnly(nestedField)) {
      if (!fieldAffectsData(nestedField)) {
        return recursivelyBuildNestedPaths(parentName, nestedFieldName, nestedField);
      }

      const nestedPathName = fieldAffectsData(nestedField) ? `${nestedFieldName ? `${nestedFieldName}__` : ''}${nestedField.name}` : undefined;
      const getFieldSchema = fieldToSchemaMap(parentName, nestedFieldName)[nestedField.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema({
          ...nestedField,
          name: nestedPathName,
        });

        if (Array.isArray(fieldSchema)) {
          return [
            ...nestedFields,
            ...fieldSchema,
          ];
        }

        return [
          ...nestedFields,
          {
            key: nestedPathName,
            type: fieldSchema,
          },
        ];
      }
    }

    return nestedFields;
  }, []);

  return nestedPaths;
};

export default recursivelyBuildNestedPaths;
