const fs = require('fs');
const { NotFound, Forbidden, ErrorDeletingFile } = require('../../errors');
const executeAccess = require('../../auth/executeAccess');

const deleteQuery = async (args) => {
  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    req,
    req: {
      locale,
      fallbackLocale,
    },
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = await executeAccess({ req, id }, collectionConfig.access.delete);
  const hasWhereAccess = typeof accessResults === 'object';

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  collectionConfig.hooks.beforeDelete.forEach((hook) => hook({ req, id }));

  // /////////////////////////////////////
  // 3. Get existing document
  // /////////////////////////////////////

  let query = { _id: id };

  if (hasWhereAccess) {
    query = {
      ...query,
      ...accessResults,
    };
  }

  let resultToDelete = await Model.findOne(query);

  if (!resultToDelete && !hasWhereAccess) throw new NotFound();
  if (!resultToDelete && hasWhereAccess) throw new Forbidden();

  resultToDelete = resultToDelete.toJSON({ virtuals: true });

  if (locale && resultToDelete.setLocale) {
    resultToDelete.setLocale(locale, fallbackLocale);
  }

  // /////////////////////////////////////
  // 4. Delete any associated files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const { staticDir } = collectionConfig.upload;

    fs.unlink(`${staticDir}/${resultToDelete.filename}`, () => {
      throw new ErrorDeletingFile();
    });

    if (resultToDelete.sizes) {
      Object.values(resultToDelete.sizes).forEach((size) => {
        fs.unlink(`${staticDir}/${size.filename}`, () => {
          throw new ErrorDeletingFile();
        });
      });
    }
  }

  // /////////////////////////////////////
  // 5. Delete database document
  // /////////////////////////////////////

  let result = await Model.findOneAndDelete({ _id: id });

  result = result.toJSON({ virtuals: true });

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  // /////////////////////////////////////
  // 4. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({ req, id, doc: result }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 5. Return results
  // /////////////////////////////////////

  return result;
};

module.exports = deleteQuery;
