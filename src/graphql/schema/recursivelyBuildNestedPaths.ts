import {
  fieldAffectsData,
  fieldIsPresentationalOnly,
  FieldWithSubFields,
  RelationshipField,
  TabsField,
} from '../../fields/config/types';
import { Payload } from '../../payload';
import fieldToSchemaMap from './fieldToWhereInputSchemaMap';

const getNestedFieldName = (fieldName: string, previousFieldName?: string) => {
  if (previousFieldName) {
    if (fieldName) {
      return `${previousFieldName}__${fieldName}`;
    }

    return previousFieldName;
  }

  return fieldName;
};

const recursivelyBuildNestedPaths = (payload: Payload, parentName: string, previousFieldName: string, field: FieldWithSubFields | TabsField | RelationshipField): any[] => {
  const fieldName = fieldAffectsData(field) ? field.name : undefined;
  const nestedFieldName = getNestedFieldName(fieldName, previousFieldName);

  if (field.type === 'tabs') {
    // if the tab has a name, treat it as a group
    // otherwise, treat it as a row
    return field.tabs.reduce((tabSchema, tab: any) => {
      tabSchema.push(...recursivelyBuildNestedPaths(payload, parentName, nestedFieldName, {
        ...tab,
        type: 'name' in tab ? 'group' : 'row',
      }));
      return tabSchema;
    }, []);
  }

  if (field.type === 'relationship' && typeof field.relationTo !== 'string') {
    return [];
  }

  const fields = field.type === 'relationship' ? payload.collections[field.relationTo as string].config.fields : field.fields;

  const nestedPaths = fields.reduce((nestedFields, nestedField) => {
    if (!fieldIsPresentationalOnly(nestedField)) {
      if (!fieldAffectsData(nestedField)) {
        return [
          ...nestedFields,
          ...recursivelyBuildNestedPaths(payload, parentName, nestedFieldName, nestedField),
        ];
      }

      const nestedPathName = fieldAffectsData(nestedField) ? `${nestedFieldName ? `${nestedFieldName}__` : ''}${nestedField.name}` : undefined;
      const getFieldSchema = fieldToSchemaMap(payload, parentName)[nestedField.type];

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
