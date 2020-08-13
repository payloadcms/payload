const fs = require('fs');
const { NotFound, Forbidden, ErrorDeletingFile } = require('../../errors');
const executeAccess = require('../../auth/executeAccess');

async function deleteQuery(args) {
  const {
    depth,
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
    overrideAccess,
  } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.delete) : true;
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

    fs.unlink(`${staticDir}/${resultToDelete.filename}`, (err) => {
      if (err) {
        throw new ErrorDeletingFile();
      }
    });

    if (resultToDelete.sizes) {
      Object.values(resultToDelete.sizes).forEach((size) => {
        fs.unlink(`${staticDir}/${size.filename}`, (err) => {
          if (err) {
            throw new ErrorDeletingFile();
          }
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
  // 7. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({ req, id, doc: result }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 8. Return results
  // /////////////////////////////////////

  return result;
}

module.exports = deleteQuery;
