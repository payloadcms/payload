const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const { NotFound, Forbidden } = require('../../errors');
const executePolicy = require('../executePolicy');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  // /////////////////////////////////////
  // 1. Execute policy
  // /////////////////////////////////////

  const policyResults = await executePolicy(args, args.config.policies.update);
  const hasWherePolicy = typeof policyResults === 'object';

  let options = { ...args };

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  const {
    Model,
    id,
    req: {
      locale,
      fallbackLocale,
    },
  } = options;

  let query = { _id: id };

  if (hasWherePolicy) {
    query = {
      ...query,
      ...policyResults,
    };
  }

  let user = await Model.findOne(query);

  if (!user && !hasWherePolicy) throw new NotFound();
  if (!user && hasWherePolicy) throw new Forbidden();

  if (locale && user.setLocale) {
    user.setLocale(locale, fallbackLocale);
  }

  const userJSON = user.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 2. Execute before update hook
  // /////////////////////////////////////

  const { beforeUpdate } = args.config.hooks;

  if (typeof beforeUpdate === 'function') {
    options = await beforeUpdate(options);
  }

  // /////////////////////////////////////
  // 3. Merge updates into existing data
  // /////////////////////////////////////

  options.data = deepmerge(userJSON, options.data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 4. Execute field-level hooks, policies, and validation
  // /////////////////////////////////////

  options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

  // /////////////////////////////////////
  // 5. Handle password update
  // /////////////////////////////////////

  const dataToUpdate = { ...options.data };
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
  // 7. Execute field-level hooks and policies
  // /////////////////////////////////////

  user = performFieldOperations(args.config, {
    ...options, data: user, hook: 'afterRead', operationName: 'read',
  });

  // /////////////////////////////////////
  // 8. Execute after update hook
  // /////////////////////////////////////

  const afterUpdateHook = args.config.hooks && args.config.hooks.afterUpdate;

  if (typeof afterUpdateHook === 'function') {
    user = await afterUpdateHook(options, user);
  }

  // /////////////////////////////////////
  // 9. Return user
  // /////////////////////////////////////

  return user;
};

module.exports = update;
