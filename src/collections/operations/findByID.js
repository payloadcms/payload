const { Forbidden, NotFound } = require('../../errors');
const executeAccess = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const findByID = async (args) => {
  const {
    config,
    depth,
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    req,
    req: {
      locale,
      fallbackLocale,
      payloadAPI,
    },
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = await executeAccess({ req }, collectionConfig.access.read);
  const hasWhereAccess = typeof accessResults === 'object';

  const queryToBuild = {
    where: {
      and: [
        {
          _id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWhereAccess) {
    queryToBuild.where.and.push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  const { beforeRead } = collectionConfig.hooks;

  if (typeof beforeRead === 'function') {
    await beforeRead({ req, query });
  }

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  const queryOptionsToExecute = {
    options: {
      autopopulate: false,
    },
  };

  // Only allow depth override within REST.
  // If allowed in GraphQL, it would break resolvers
  // as a full object will be returned instead of an ID string
  if (payloadAPI === 'REST') {
    if (depth && depth !== '0') {
      queryOptionsToExecute.options.autopopulate = {
        maxDepth: parseInt(depth, 10),
      };
    }
  }

  let result = await Model.findOne(query, {}, queryOptionsToExecute);

  if (!result && !hasWhereAccess) throw new NotFound();
  if (!result && hasWhereAccess) throw new Forbidden();

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  result = result.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await performFieldOperations(config, collectionConfig, {
    req,
    data: result,
    hook: 'afterRead',
    operationName: 'read',
  });


  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  const { afterRead } = collectionConfig.hooks;

  if (typeof afterRead === 'function') {
    result = await afterRead({
      req,
      query,
      doc: result,
    }) || result;
  }

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return result;
};

module.exports = findByID;
