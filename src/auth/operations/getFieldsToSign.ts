import { User } from '..';
import { CollectionConfig } from '../../collections/config/types';
import { Field, fieldAffectsData, fieldHasSubFields } from '../../fields/config/types';

export const getFieldsToSign = (args: {
  collectionConfig: CollectionConfig,
  user: User
  email: string
}): Record<string, unknown> => {
  const {
    collectionConfig,
    user,
    email,
  } = args;

  return collectionConfig.fields.reduce((signedFields, field: Field) => {
    const result = {
      ...signedFields,
    };

    // get subfields from non-named fields like rows
    if (!fieldAffectsData(field) && fieldHasSubFields(field)) {
      field.fields.forEach((subField) => {
        if (fieldAffectsData(subField) && subField.saveToJWT) {
          result[typeof subField.saveToJWT === 'string' ? subField.saveToJWT : subField.name] = user[subField.name];
        }
      });
    }

    if (fieldAffectsData(field) && field.saveToJWT) {
      result[typeof field.saveToJWT === 'string' ? field.saveToJWT : field.name] = user[field.name];
    }

    return result;
  }, {
    email,
    id: user.id,
    collection: collectionConfig.slug,
  });
};
