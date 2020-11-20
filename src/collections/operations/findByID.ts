/* eslint-disable no-underscore-dangle */
import memoize from 'micro-memoize';
import removeInternalFields from '../../utilities/removeInternalFields';
import { Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';

async function findByID(incomingArgs) {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'read',
    })) || args;
  }, Promise.resolve());

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
  // Access
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
  // Find by ID
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

  // Clone the result - it may have come back memoized
  result = JSON.parse(JSON.stringify(result));

  result.id = result._id;

  result = removeInternalFields(result);

  // /////////////////////////////////////
  // beforeRead - Collection
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
  // afterRead - Fields
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
  // afterRead - Collection
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
  // Return results
  // /////////////////////////////////////

  return result;
}

export default findByID;
