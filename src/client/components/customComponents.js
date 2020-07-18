function stringify(obj) {
  if (typeof obj === 'object') {
    const result = [];
    Object.keys(obj).forEach((key) => {
      const val = stringify(obj[key]);
      if (val !== null) {
        result.push(`"${key}": ${val}`);
      }
    });
    return `{${result.join(',')}}`;
  }
  return `React.lazy(() => import('${obj}'))`;
}

function recursivelyAddFieldComponents(fields) {
  if (fields) {
    return fields.reduce((allFields, field) => {
      const subFields = recursivelyAddFieldComponents(field.fields);

      if (!field.name && field.fields) {
        return {
          ...allFields,
          ...subFields,
        };
      }

      if (field.components || field.fields) {
        const fieldComponents = {
          ...(field.admin.components || {}),
        };

        if (field.fields) {
          fieldComponents.fields = subFields;
        }

        const result = {
          ...allFields,
          [field.name]: {
            ...fieldComponents,
          },
        };

        return result;
      }

      return allFields;
    }, {});
  }

  return {};
}

function customComponents(config) {
  const allCollectionComponents = config.collections.reduce((components, collection) => {
    const newComponents = { ...components };

    newComponents[collection.slug] = {
      fields: recursivelyAddFieldComponents(collection.fields),
      ...(collection.admin.components || {}),
    };

    return newComponents;
  }, {});

  const allGlobalComponents = config.globals ? config.globals.reduce((globals, global) => {
    const newComponents = { ...globals };

    newComponents[global.slug] = {
      fields: recursivelyAddFieldComponents(global.fields),
      ...(global.admin.components || {}),
    };

    return newComponents;
  }, {}) : {};

  const string = stringify({
    ...(allCollectionComponents || {}),
    ...(allGlobalComponents || {}),
    ...(config.admin.components || {}),
  }).replace(/\\/g, '\\\\');

  return {
    code: `
      const React = require('react');
      module.exports = ${string};
  `,
  };
}

module.exports = customComponents;
