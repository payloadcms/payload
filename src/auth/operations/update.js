const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const { NotFound, Forbidden } = require('../../errors');
const executeAccess = require('../executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  const {
    config,
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
  // 1. Execute access
  // /////////////////////////////////////

  const accessResults = await executeAccess({ req }, collectionConfig.access.update);
  const hasWhereAccess = typeof accessResults === 'object';

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  let query = { _id: id };

  if (hasWhereAccess) {
    query = {
      ...query,
      ...accessResults,
    };
  }

  let user = await Model.findOne(query);

  if (!user && !hasWhereAccess) throw new NotFound();
  if (!user && hasWhereAccess) throw new Forbidden();

  if (locale && user.setLocale) {
    user.setLocale(locale, fallbackLocale);
  }

  const originalDoc = user.toJSON({ virtuals: true });

  let { data } = args;

  // /////////////////////////////////////
  // 2. Execute before update hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 3. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(originalDoc, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 4. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(config, collectionConfig, {
    data,
    req,
    hook: 'beforeUpdate',
    operationName: 'update',
    originalDoc,
  });

  // /////////////////////////////////////
  // 5. Handle password update
  // /////////////////////////////////////

  const dataToUpdate = { ...data };
  const { password } = dataToUpdate;

  if (password) {
    delete dataToUpdate.password;
    await user.setPassword(password);
  }

  // /////////////////////////////////////
  // 6. Perform database operation
  // /////////////////////////////////////

  Object.assign(user, dataToUpdate);

  await user.save();

  user = user.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  user = performFieldOperations(config, collectionConfig, {
    data: user,
    hook: 'afterRead',
    operationName: 'read',
    req,
  });

  // /////////////////////////////////////
  // 8. Execute after update hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    user = await hook({
      doc: user,
      req,
    }) || user;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 9. Return user
  // /////////////////////////////////////

  return user;
};

module.exports = update;
