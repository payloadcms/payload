const httpStatus = require('http-status');
const deepmerge = require('deepmerge');
const path = require('path');

const removeInternalFields = require('../../utilities/removeInternalFields');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeAccess = require('../../auth/executeAccess');
const { NotFound, Forbidden, APIError, FileUploadError } = require('../../errors');
const imageMIMETypes = require('../../uploads/imageMIMETypes');
const getImageSize = require('../../uploads/getImageSize');
const getSafeFilename = require('../../uploads/getSafeFilename');

const resizeAndSave = require('../../uploads/imageResizer');

async function update(incomingArgs) {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'update',
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

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.update) : true;
  const hasWherePolicy = typeof accessResults === 'object';

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

  if (hasWherePolicy) {
    queryToBuild.where.and.push(hasWherePolicy);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  let doc = await Model.findOne(query);

  if (!doc && !hasWherePolicy) throw new NotFound();
  if (!doc && hasWherePolicy) throw new Forbidden();

  if (locale && doc.setLocale) {
    doc.setLocale(locale, fallbackLocale);
  }

  let originalDoc = doc.toJSON({ virtuals: true });

  originalDoc = JSON.stringify(originalDoc);
  originalDoc = JSON.parse(originalDoc);

  let { data } = args;

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeValidate',
    operation: 'update',
    overrideAccess,
  });

  // /////////////////////////////////////
  // beforeValidate - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'update',
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeChange',
    operation: 'update',
    overrideAccess,
  });

  // /////////////////////////////////////
  // beforeChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(originalDoc, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // Upload and resize potential files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    let staticPath = staticDir;

    if (staticDir.indexOf('/') !== 0) {
      staticPath = path.join(this.config.paths.configDir, staticDir);
    }

    const file = (req.files && req.files.file) ? req.files.file : req.fileData;

    if (file) {
      const fsSafeName = await getSafeFilename(staticPath, file.name);

      try {
        await file.mv(`${staticPath}/${fsSafeName}`);

        fileData.filename = fsSafeName;
        fileData.filesize = file.size;
        fileData.mimeType = file.mimetype;

        if (imageMIMETypes.indexOf(file.mimetype) > -1) {
          const dimensions = await getImageSize(`${staticPath}/${fsSafeName}`);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;

          if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
            fileData.sizes = await resizeAndSave(staticPath, collectionConfig, fsSafeName, fileData.mimeType);
          }
        }
      } catch (err) {
        throw new FileUploadError(err);
      }


      data = {
        ...data,
        ...fileData,
      };
    } else if (data.file === null) {
      data = {
        ...data,
        filename: null,
        sizes: null,
      };
    }
  }

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  const { password } = data;

  if (password) {
    await doc.setPassword(password);
    delete data.password;
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  Object.assign(doc, data);

  await doc.save();

  doc = doc.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  doc = await this.performFieldOperations(collectionConfig, {
    data: doc,
    hook: 'afterChange',
    operation: 'update',
    req,
    id,
    depth,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      doc,
      req,
      operation: 'update',
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  doc = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: doc,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess,
    reduceLocales: true,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  doc = removeInternalFields(doc);
  doc = JSON.stringify(doc);
  doc = JSON.parse(doc);

  return doc;
}

module.exports = update;
