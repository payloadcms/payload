const passport = require('passport');
const executeAccess = require('../executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const register = async (args) => {
  const {
    overrideAccess,
    config,
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
      fallbackLocale,
    },
  } = args;

  let { data } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, collectionConfig.access.create);
  }

  // /////////////////////////////////////
  // 2. Execute before register hook
  // /////////////////////////////////////

  collectionConfig.hooks.beforeRegister.forEach(async (hook) => {
    data = (await hook({
      data,
      req,
    })) || data;
  });

  // /////////////////////////////////////
  // 3. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(config, collectionConfig, {
    data,
    hook: 'beforeCreate',
    operationName: 'create',
    req,
  });

  // /////////////////////////////////////
  // 6. Perform register
  // /////////////////////////////////////

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

  result = await performFieldOperations(config, collectionConfig, {
    data: result,
    hook: 'afterRead',
    operationName: 'read',
    req,
  });

  // /////////////////////////////////////
  // 8. Execute after register hook
  // /////////////////////////////////////

  collectionConfig.hooks.afterRegister.forEach(async (hook) => {
    result = await hook({
      doc: result,
      req: args.req,
    }) || result;
  });

  // /////////////////////////////////////
  // 9. Return user
  // /////////////////////////////////////

  return result;
};

module.exports = register;
