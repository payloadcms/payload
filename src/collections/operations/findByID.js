/* eslint-disable no-underscore-dangle */
const memoize = require('micro-memoize');
const removeInternalFields = require('../../utilities/removeInternalFields');
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
    showHiddenFields,
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

  if (!req.findByID) req.findByID = {};

  if (!req.findByID[collectionConfig.slug]) {
    const nonMemoizedFindByID = async (q) => Model.findOne(q, {}).lean();
    req.findByID[collectionConfig.slug] = memoize(nonMemoizedFindByID, {
      isPromise: true,
      maxSize: 100,
      transformKey: JSON.stringify,
    });
  }

  let result = await req.findByID[collectionConfig.slug](query);

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) throw new NotFound();
      if (hasWhereAccess) throw new Forbidden();
    }

    return null;
  }

  result.id = result._id;

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
    showHiddenFields,
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

  result = removeInternalFields(result);
  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
}

module.exports = findByID;
