const fs = require('fs');
const { NotFound, Forbidden, ErrorDeletingFile } = require('../../errors');
const executeStatic = require('../../auth/executeAccess');

const deleteQuery = async (args) => {
  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  const policyResults = await executeStatic(args, args.config.access.delete);
  const hasWherePolicy = typeof policyResults === 'object';

  let options = {
    ...args,
  };

  // /////////////////////////////////////
  // 2. Execute before collection hook
  // /////////////////////////////////////

  const { beforeDelete } = args.config.hooks;

  if (typeof beforeDelete === 'function') {
    options = await beforeDelete(options);
  }

  // /////////////////////////////////////
  // 3. Get existing document
  // /////////////////////////////////////

  const {
    Model,
    id,
    req: {
      locale,
      fallbackLocale,
    },
  } = options;

  let query = { _id: id };

  if (hasWherePolicy) {
    query = {
      ...query,
      ...policyResults,
    };
  }

  let resultToDelete = await Model.findOne(query);

  if (!resultToDelete && !hasWherePolicy) throw new NotFound();
  if (!resultToDelete && hasWherePolicy) throw new Forbidden();

  resultToDelete = resultToDelete.toJSON({ virtuals: true });

  if (locale && resultToDelete.setLocale) {
    resultToDelete.setLocale(locale, fallbackLocale);
  }

  // /////////////////////////////////////
  // 4. Delete any associated files
  // /////////////////////////////////////

  if (options.req.collection.config.upload) {
    const { staticDir } = options.req.collection.config.upload;

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

  const { afterDelete } = args.config.hooks;

  if (typeof afterDelete === 'function') {
    result = await afterDelete(options, result) || result;
  }

  // /////////////////////////////////////
  // 5. Return results
  // /////////////////////////////////////

  return result;
};

module.exports = deleteQuery;
