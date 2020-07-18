const executeAccess = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const findOne = async (args) => {
  const {
    config,
    globalConfig,
    Model,
    req,
    req: {
      payloadAPI,
      locale,
      fallbackLocale,
    },
    slug,
    depth,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  await executeAccess({ req }, globalConfig.access.read);

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  globalConfig.hooks.beforeRead.forEach((hook) => hook({ req }));

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  const queryOptionsToExecute = {
    options: {},
  };

  // Only allow depth override within REST.
  // If allowed in GraphQL, it would break resolvers
  // as a full object will be returned instead of an ID string
  if (payloadAPI === 'REST') {
    if (depth && depth !== '0') {
      queryOptionsToExecute.options.autopopulate = {
        maxDepth: parseInt(depth, 10),
      };
    } else {
      queryOptionsToExecute.options.autopopulate = false;
    }
  }

  let doc = await Model.findOne({ globalType: slug });

  if (!doc) {
    doc = {};
  } else {
    if (locale && doc.setLocale) {
      doc.setLocale(locale, fallbackLocale);
    }

    doc = doc.toJSON({ virtuals: true });
  }


  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = performFieldOperations(config, globalConfig, {
    data: doc,
    hook: 'afterRead',
    operationName: 'read',
    req,
  });

  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return doc;
};

module.exports = findOne;
