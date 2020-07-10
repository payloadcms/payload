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

  const { beforeRead } = globalConfig.hooks;

  if (typeof beforeRead === 'function') {
    await beforeRead({ req });
  }

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

  let result = await Model.findOne({ globalType: slug });
  let doc = {};

  if (!result) {
    result = {};
  } else {
    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    doc = result.toJSON({ virtuals: true });
  }


  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = performFieldOperations(config, globalConfig, {
    doc,
    hook: 'afterRead',
    operationName: 'read',
    req,
  });

  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  const { afterRead } = globalConfig.hooks;

  if (typeof afterRead === 'function') {
    doc = await afterRead({
      req,
      doc,
    }) || doc;
  }

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return doc;
};

module.exports = findOne;
