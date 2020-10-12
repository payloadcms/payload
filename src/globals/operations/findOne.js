const executeAccess = require('../../auth/executeAccess');

async function findOne(args) {
  const { globals: { Model } } = this;

  const {
    globalConfig,
    req,
    slug,
    depth,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  await executeAccess({ req }, globalConfig.access.read);

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  globalConfig.hooks.beforeRead.forEach((hook) => hook({ req }));

  // /////////////////////////////////////
  // 3. Perform database operation
  // /////////////////////////////////////

  let doc = await Model.findOne({ globalType: slug }).lean();

  if (!doc) {
    doc = {};
  } else if (doc._id) {
    doc.id = doc._id;
    delete doc._id;
  }

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = await this.performFieldOperations(globalConfig, {
    data: doc,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    reduceLocales: true,
  });

  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return doc;
}

module.exports = findOne;
