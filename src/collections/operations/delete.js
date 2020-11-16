const fs = require('fs');
const path = require('path');

const removeInternalFields = require('../../utilities/removeInternalFields');
const { NotFound, Forbidden, ErrorDeletingFile } = require('../../errors');
const executeAccess = require('../../auth/executeAccess');
const fileExists = require('../../uploads/fileExists');

async function deleteQuery(incomingArgs) {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'delete',
    })) || args;
  }, Promise.resolve());

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
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.delete) : true;
  const hasWhereAccess = typeof accessResults === 'object';

  // /////////////////////////////////////
  // beforeDelete - Collection
  // /////////////////////////////////////

  collectionConfig.hooks.beforeDelete.forEach((hook) => hook({ req, id }));

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild = {
    where: {
      and: [
        {
          id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWhereAccess) {
    queryToBuild.where.and.push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  let resultToDelete = await Model.findOne(query);

  if (!resultToDelete && !hasWhereAccess) throw new NotFound();
  if (!resultToDelete && hasWhereAccess) throw new Forbidden();

  resultToDelete = resultToDelete.toJSON({ virtuals: true });

  if (locale && resultToDelete.setLocale) {
    resultToDelete.setLocale(locale, fallbackLocale);
  }

  // /////////////////////////////////////
  // Delete any associated files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const { staticDir } = collectionConfig.upload;

    const staticPath = path.resolve(this.config.paths.configDir, staticDir);

    const fileToDelete = `${staticPath}/${resultToDelete.filename}`;
    if (await fileExists(fileToDelete)) {
      fs.unlink(fileToDelete, (err) => {
        if (err) {
          throw new ErrorDeletingFile();
        }
      });
    }

    if (resultToDelete.sizes) {
      Object.values(resultToDelete.sizes).forEach(async (size) => {
        if (await fileExists(`${staticPath}/${size.filename}`)) {
          fs.unlink(`${staticPath}/${size.filename}`, (err) => {
            if (err) {
              throw new ErrorDeletingFile();
            }
          });
        }
      });
    }
  }

  // /////////////////////////////////////
  // Delete document
  // /////////////////////////////////////

  let result = await Model.findOneAndDelete({ _id: id });

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  result = result.toJSON({ virtuals: true });

  result = removeInternalFields(result);
  result = JSON.stringify(result);
  result = JSON.parse(result);

  // /////////////////////////////////////
  // afterDelete - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({ req, id, doc: result }) || result;
  }, Promise.resolve());


  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'delete',
    overrideAccess,
    reduceLocales: false,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      req,
      doc: result,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 8. Return results
  // /////////////////////////////////////

  return result;
}

module.exports = deleteQuery;
