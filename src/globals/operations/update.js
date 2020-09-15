const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeAccess = require('../../auth/executeAccess');

async function update(args) {
  const { globals: { Model } } = this;

  const {
    globalConfig,
    slug,
    req,
    req: {
      locale,
      fallbackLocale,
    },
    depth,
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, globalConfig.access.update);
  }

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

  let { data } = args;

  // /////////////////////////////////////
  // 3. Execute before validate collection hooks
  // /////////////////////////////////////

  await globalConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(globalConfig, {
    data,
    req,
    hook: 'beforeChange',
    operation: 'update',
    originalDoc: global,
  });

  // /////////////////////////////////////
  // 5. Execute before global hook
  // /////////////////////////////////////

  await globalConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc: global,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(globalJSON, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 7. Perform database operation
  // /////////////////////////////////////

  Object.assign(global, data);

  await global.save();

  global = global.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 8. Execute field-level hooks and access
  // /////////////////////////////////////

  global = await this.performFieldOperations(globalConfig, {
    data: global,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
  });

  // /////////////////////////////////////
  // 9. Execute after global hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    global = await hook({
      doc: global,
      req,
      operation: 'update',
    }) || global;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 10. Return global
  // /////////////////////////////////////

  return global;
}

module.exports = update;
