import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState';
export const linkValidation = (props, sanitizedFieldsWithoutText) => {
  return async ({
    node,
    validation: {
      options: {
        id,
        collectionSlug,
        data,
        operation,
        preferences,
        req
      }
    }
  }) => {
    /**
    * Run fieldSchemasToFormState as that properly validates link fields and link sub-fields
    */
    const result = await fieldSchemasToFormState({
      id,
      collectionSlug,
      data: node.fields,
      documentData: data,
      fields: sanitizedFieldsWithoutText,
      fieldSchemaMap: undefined,
      initialBlockData: node.fields,
      operation: operation === 'create' || operation === 'update' ? operation : 'update',
      permissions: {},
      preferences,
      renderAllFields: false,
      req,
      schemaPath: ''
    });
    const errorPathsSet = new Set();
    for (const fieldKey in result) {
      const fieldState = result[fieldKey];
      if (fieldState?.errorPaths?.length) {
        for (const errorPath of fieldState.errorPaths) {
          errorPathsSet.add(errorPath);
        }
      }
    }
    const errorPaths = Array.from(errorPathsSet);
    if (errorPaths.length) {
      return 'The following fields are invalid: ' + errorPaths.join(', ');
    }
    return true;
  };
};
//# sourceMappingURL=validate.js.map