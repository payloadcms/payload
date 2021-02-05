import deepmerge from 'deepmerge';
import merge from 'lodash.merge';
import overwriteMerge from '../../utilities/overwriteMerge';
import executeAccess from '../../auth/executeAccess';
import removeInternalFields from '../../utilities/removeInternalFields';

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
    showHiddenFields,
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
    global.setLocale(locale, null);
  }

  const globalJSON = global.toJSON({ virtuals: true });

  if (globalJSON._id) {
    delete globalJSON._id;
  }

  let { data } = args;

  // /////////////////////////////////////
  // 3. Execute before validate collection hooks
  // /////////////////////////////////////

  await globalConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc: globalJSON,
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
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(globalJSON, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 7. Perform database operation
  // /////////////////////////////////////

  merge(global, data);

  await global.save();

  if (locale && global.setLocale) {
    global.setLocale(locale, fallbackLocale);
  }

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
    showHiddenFields,
  });

  // /////////////////////////////////////
  // 9. Execute after global hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    global = await hook({
      doc: global,
      req,
    }) || global;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 10. Return global
  // /////////////////////////////////////

  global = removeInternalFields(global);

  return global;
}

export default update;
