function formatRefPathLocales(schema, parentSchema, parentPath) {
  // Loop through all refPaths within schema
  schema.eachPath((pathname, schemaType) => {
    // If a dynamic refPath is found
    if (schemaType.options.refPath && schemaType.options.refPath.includes('{{LOCALE}}') && parentSchema) {
      // Create a clone of the schema for each locale
      const newSchema = schema.clone();

      // Remove the old pathname in order to rebuild it after it's formatted
      newSchema.remove(pathname);

      // Get the locale from the parent path
      let locale = parentPath;

      // Split the parent path and take only the last segment as locale
      if (parentPath && parentPath.includes('.')) {
        locale = parentPath.split('.').pop();
      }

      // Replace {{LOCALE}} appropriately
      const refPath = schemaType.options.refPath.replace('{{LOCALE}}', locale);

      // Add new schemaType back to newly cloned schema
      newSchema.add({
        [pathname]: {
          ...schemaType.options,
          refPath,
        },
      });

      // Removing and adding a path to a schema does not update tree, so do it manually
      newSchema.tree[pathname].refPath = refPath;

      const parentSchemaType = parentSchema.path(parentPath).instance;

      // Remove old schema from parent
      parentSchema.remove(parentPath);

      // Replace newly cloned and updated schema on parent
      parentSchema.add({
        [parentPath]: parentSchemaType === 'Array' ? [newSchema] : newSchema,
      });
    }

    // If nested schema found, continue recursively
    if (schemaType.schema) {
      formatRefPathLocales(schemaType.schema, schema, pathname);
    }
  });
}

export default formatRefPathLocales;
