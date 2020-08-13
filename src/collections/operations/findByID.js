/* eslint-disable no-underscore-dangle */
const { Forbidden, NotFound } = require('../../errors');
const executeAccess = require('../../auth/executeAccess');

async function findByID(args) {
  const {
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
    disableErrors,
    currentDepth,
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors }, collectionConfig.access.read) : true;
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

  if (!query.$and[0]._id) throw new NotFound();

  let result = await Model.findOne(query, {});

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) throw new NotFound();
      if (hasWhereAccess) throw new Forbidden();
    }

    return null;
  }

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  result = result.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'read',
    currentDepth,
    overrideAccess,
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
}

module.exports = findByID;
