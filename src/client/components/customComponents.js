const path = require('path');

function stringify(obj, config) {
  if (typeof obj === 'object') {
    const result = [];
    Object.keys(obj).forEach((key) => {
      const val = stringify(obj[key], config);
      if (val !== null) {
        result.push(`"${key}": ${val}`);
      }
    });
    return `{${result.join(',')}}`;
  }
  return `ReactLazyPreload(() => import('${path.join(config.paths.configDir, obj)}'))`;
}

function recursivelyAddFieldComponents(fields, config) {
  if (fields) {
    return fields.reduce((allFields, field) => {
      const subFields = recursivelyAddFieldComponents(field.fields, config);

      if (!field.name && field.fields) {
        return {
          ...allFields,
          ...subFields,
        };
      }

      if (field.admin.components || field.fields || field.admin.elements || field.admin.leaves) {
        const fieldComponents = {
          ...(field.admin.components || {}),
        };

        if (field.admin.elements) {
          fieldComponents.elements = {};

          field.admin.elements.forEach((element) => {
            if (typeof element === 'object') {
              fieldComponents.elements[element.name] = {
                element: element.element,
                button: element.button,
              };
            }
          });
        }

        if (field.admin.leaves) {
          fieldComponents.leaves = {};

          field.admin.leaves.forEach((leaf) => {
            if (typeof leaf === 'object') {
              fieldComponents.leaves[leaf.name] = {
                leaf: leaf.leaf,
                button: leaf.button,
              };
            }
          });
        }

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
      fields: recursivelyAddFieldComponents(collection.fields, config),
      ...(collection.admin.components || {}),
    };

    return newComponents;
  }, {});

  const allGlobalComponents = config.globals ? config.globals.reduce((globals, global) => {
    const newComponents = { ...globals };

    newComponents[global.slug] = {
      fields: recursivelyAddFieldComponents(global.fields, config),
      ...(global.admin.components || {}),
    };

    return newComponents;
  }, {}) : {};

  const string = stringify({
    ...(allCollectionComponents || {}),
    ...(allGlobalComponents || {}),
    ...(config.admin.components || {}),
  }, config).replace(/\\/g, '\\\\');

  return {
    code: `
      const React = require('react');

      const ReactLazyPreload = importStatement => {
        const Component = React.lazy(importStatement);
        Component.preload = importStatement;
        return Component;
      };

      export default ${string};
  `,
  };
}

module.exports = customComponents;
