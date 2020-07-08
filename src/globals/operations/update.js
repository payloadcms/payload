const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeStatic = require('../../auth/executeAccess');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  await executeStatic(args, args.config.access.update);

  let options = { ...args };

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  const {
    Model,
    slug,
    req: {
      locale,
      fallbackLocale,
    },
  } = options;

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

  const { beforeUpdate } = args.config.hooks;

  if (typeof beforeUpdate === 'function') {
    options = await beforeUpdate(options);
  }

  // /////////////////////////////////////
  // 4. Merge updates into existing data
  // /////////////////////////////////////

  options.data = deepmerge(globalJSON, options.data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 5. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

  // /////////////////////////////////////
  // 6. Perform database operation
  // /////////////////////////////////////

  Object.assign(global, options.data);

  await global.save();

  global = global.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  global = await performFieldOperations(args.config, {
    ...options, data: global, hook: 'afterRead', operationName: 'read',
  });

  // /////////////////////////////////////
  // 8. Execute after global hook
  // /////////////////////////////////////

  const { afterUpdate } = args.config.hooks;

  if (typeof afterUpdate === 'function') {
    global = await afterUpdate(options, global);
  }

  // /////////////////////////////////////
  // 9. Return global
  // /////////////////////////////////////

  return global;
};

module.exports = update;
