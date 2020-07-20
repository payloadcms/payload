const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeAccess = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  const {
    config,
    globalConfig,
    Model,
    slug,
    req,
    req: {
      locale,
      fallbackLocale,
    },
    depth,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  await executeAccess(args, globalConfig.access.update);

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  let global = await Model.findOne({ globalType: slug });

  if (!global) {
    global = new Model({ globalType: slug });
  }

  if (locale && global.setLocale) {
    global.setLocale(locale, fallbackLocale);
  }

  const globalJSON = global.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 3. Execute before global hook
  // /////////////////////////////////////

  let { data } = args;

  await globalConfig.hooks.beforeUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc: global,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(globalJSON, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 5. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(config, globalConfig, {
    data,
    req,
    hook: 'beforeUpdate',
    operationName: 'update',
    originalDoc: globalJSON,
  });

  // /////////////////////////////////////
  // 6. Perform database operation
  // /////////////////////////////////////

  Object.assign(global, data);

  await global.save();

  global = global.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  global = await performFieldOperations(config, globalConfig, {
    data: global,
    hook: 'afterRead',
    operationName: 'read',
    req,
    depth,
  });

  // /////////////////////////////////////
  // 8. Execute after global hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    global = await hook({
      doc: global,
      req,
    }) || global;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 9. Return global
  // /////////////////////////////////////

  return global;
};

module.exports = update;
