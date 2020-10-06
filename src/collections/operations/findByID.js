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
    },
    disableErrors,
    currentDepth,
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors, id }, collectionConfig.access.read) : true;
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
  // 2. Perform database operation
  // /////////////////////////////////////

  if (!query.$and[0]._id) throw new NotFound();

  let result = await Model.findOne(query, {}).lean();

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) throw new NotFound();
      if (hasWhereAccess) throw new Forbidden();
    }

    return null;
  }

  if (result._id) {
    result.id = result._id;
    delete result._id;
  }

  if (typeof result.__v !== 'undefined') {
    delete result.__v;
  }

  // /////////////////////////////////////
  // 3. Execute beforeRead collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      req,
      query,
      doc: result,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    id,
    data: result,
    hook: 'afterRead',
    operation: 'read',
    currentDepth,
    overrideAccess,
    reduceLocales: true,
  });


  // /////////////////////////////////////
  // 5. Execute afterRead collection hook
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
