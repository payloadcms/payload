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
  // 2. Execute before validate collection hooks
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());


  // /////////////////////////////////////
  // 3. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeChange',
    operation: 'create',
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 4. Execute before create hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 5. Perform register
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
  // 6. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 7. Execute after create hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req: args.req,
      operation: 'create',
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 8. Return user
  // /////////////////////////////////////
  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
}

module.exports = register;
