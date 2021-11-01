import { SchemaType, SchemaTypeOptions } from 'mongoose';

export const getSchemaTypeOptions = (schemaType: SchemaType): SchemaTypeOptions<{ localized: boolean }> => {
  if (schemaType?.instance === 'Array') {
    return schemaType.options.type[0];
  }

  return schemaType?.options;
};
