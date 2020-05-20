const deepCopyObject = require('../utilities/deepCopyObject');

const recursivelySecure = (object) => {
  const newObject = deepCopyObject(object);

  delete newObject.hooks;
  delete newObject.components;
  delete newObject.policies;

  if (newObject.fields) {
    newObject.fields.forEach((field, i) => {
      newObject.fields[i] = recursivelySecure(field);
    });
  }

  return newObject;
};

const secureConfig = (insecureConfig) => {
  const config = deepCopyObject(insecureConfig);

  delete config.secret;

  recursivelySecure(config);

  config.collections.forEach((collection, i) => {
    config.collections[i] = recursivelySecure(collection);
  });

  return config;
};

module.exports = secureConfig;
