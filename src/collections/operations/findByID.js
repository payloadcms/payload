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

  collectionConfig.hooks.beforeRead.forEach((hook) => hook({ req, query }));

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  let result = await Model.findOne(query, {});

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
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operationName: 'read',
  });


  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      req,
      query,
      doc: result,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return result;
};

module.exports = findByID;
