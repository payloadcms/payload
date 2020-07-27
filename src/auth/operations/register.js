const passport = require('passport');
const executeAccess = require('../executeAccess');

async function register(args) {
  const {
    depth,
    overrideAccess,
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
  // 2. Execute before create hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeCreate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 3. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
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

  result = await this.performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterRead',
    operationName: 'read',
    req,
    depth,
  });

  // /////////////////////////////////////
  // 8. Execute after create hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterCreate.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req: args.req,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 9. Return user
  // /////////////////////////////////////

  return result;
}

module.exports = register;
