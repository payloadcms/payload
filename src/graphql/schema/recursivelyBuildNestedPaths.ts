import {
  FieldAffectingData,
  fieldAffectsData,
  fieldIsPresentationalOnly,
  FieldWithSubFields,
} from '../../fields/config/types';
import fieldToSchemaMap from './fieldToWhereInputSchemaMap';

const recursivelyBuildNestedPaths = (parentName: string, field: FieldWithSubFields & FieldAffectingData) => {
  const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
    if (!fieldIsPresentationalOnly(nestedField)) {
      const getFieldSchema = fieldToSchemaMap(parentName)[nestedField.type];
      const nestedFieldName = fieldAffectsData(nestedField) ? `${field.name}__${nestedField.name}` : undefined;

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema({
          ...nestedField,
          name: nestedFieldName,
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
            key: nestedFieldName,
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
