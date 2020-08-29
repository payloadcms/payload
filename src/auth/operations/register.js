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
  // 2. Execute beforeValidate field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    hook: 'beforeValidate',
    operation: 'create',
    overrideAccess,
  });


  // /////////////////////////////////////
  // 3. Execute beforeValidate collection hooks
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
  // 4. Execute field-level access, beforeChange hooks, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeChange',
    operation: 'create',
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 5. Execute beforeChange collection hooks
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
  // 6. Perform register
  // /////////////////////////////////////

  const modelData = {
    ...data,
    email: data.email ? data.email.toLowerCase() : null,
  };

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
    operation: 'read',
    req,
    depth,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 8. Execute afterChange collcetion hooks
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
  // 9. Return user
  // /////////////////////////////////////
  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
}

module.exports = register;
