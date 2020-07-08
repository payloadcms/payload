const passport = require('passport');
const executeStatic = require('../executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const register = async (args) => {
  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!args.overridePolicy) {
    await executeStatic(args, args.collection.config.access.create);
  }

  let options = { ...args };

  // /////////////////////////////////////
  // 2. Execute before register hook
  // /////////////////////////////////////

  const { beforeRegister } = args.collection.config.hooks;

  if (typeof beforeRegister === 'function') {
    options = await beforeRegister(options);
  }

  // /////////////////////////////////////
  // 3. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  options.data = await performFieldOperations(args.collection.config, { ...options, hook: 'beforeCreate', operationName: 'create' });

  // /////////////////////////////////////
  // 6. Perform register
  // /////////////////////////////////////

  const {
    collection: {
      Model,
    },
    data,
    req: {
      locale,
      fallbackLocale,
    },
  } = options;

  const modelData = { ...data };
  delete modelData.password;

  const user = new Model();

  if (locale && user.setLocale) {
    user.setLocale(locale, fallbackLocale);
  }

  Object.assign(user, modelData);

  let result = await Model.register(user, data.password);

  await passport.authenticate('local');

  result = result.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await performFieldOperations(args.collection.config, {
    ...options, data: result, hook: 'afterRead', operationName: 'read',
  });

  // /////////////////////////////////////
  // 8. Execute after register hook
  // /////////////////////////////////////

  const afterRegister = args.collection.config.hooks;

  if (typeof afterRegister === 'function') {
    result = await afterRegister(options, result);
  }

  // /////////////////////////////////////
  // 9. Return user
  // /////////////////////////////////////

  return result;
};

module.exports = register;
