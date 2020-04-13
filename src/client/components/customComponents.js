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

module.exports = function (config) {
  const allCollectionComponents = config.collections.reduce((components, collection) => {
    const newComponents = { ...components };

    newComponents[collection.slug] = {
      fields: {},
      ...(collection.components || {}),
    };

    collection.fields.forEach((field) => {
      if (field.components) {
        newComponents[collection.slug].fields[field.name] = field.components;
      }
    });

    return newComponents;
  }, {});

  const string = stringify({
    ...(allCollectionComponents || {}),
    ...(config.components || {}),
  }).replace(/\\/g, '\\\\');

  return {
    code: `
      const React = require('react');
      module.exports = ${string};
  `,
  };
};
