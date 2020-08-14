const mkdirp = require('mkdirp');

const executeAccess = require('../../auth/executeAccess');

const { MissingFile } = require('../../errors');
const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');
const getImageSize = require('../../uploads/getImageSize');
const imageMIMETypes = require('../../uploads/imageMIMETypes');

async function create(args) {
  const { performFieldOperations } = this;

  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    req,
    req: {
      locale,
      fallbackLocale,
    },
    depth,
    overrideAccess,
  } = args;

  let { data } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, collectionConfig.access.create);
  }

  // /////////////////////////////////////
  // 2. Execute before validate collection hooks
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 3. Execute field-level access, beforeChange hooks, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeChange',
    operation: 'create',
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 4. Execute before change hooks
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 5. Upload and resize any files that may be present
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    const file = (req.files && req.files.file) ? req.files.file : req.file;

    if (!file) {
      throw new MissingFile();
    }

    mkdirp.sync(staticDir);

    const fsSafeName = await getSafeFilename(staticDir, file.name);

    await file.mv(`${staticDir}/${fsSafeName}`);

    if (imageMIMETypes.indexOf(file.mimetype) > -1) {
      const dimensions = await getImageSize(`${staticDir}/${fsSafeName}`);
      fileData.width = dimensions.width;
      fileData.height = dimensions.height;

      if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
        fileData.sizes = await resizeAndSave(collectionConfig, fsSafeName, fileData.mimeType);
      }
    }

    fileData.filename = fsSafeName;
    fileData.filesize = file.size;
    fileData.mimeType = file.mimetype;

    data = {
      ...data,
      ...fileData,
    };
  }

  // /////////////////////////////////////
  // 6. Perform database operation
  // /////////////////////////////////////

  let result = new Model();

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  Object.assign(result, data);
  await result.save();

  result = result.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 8. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req: args.req,
      operation: 'create',
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 9. Return results
  // /////////////////////////////////////

  // result = JSON.stringify(result);
  // result = JSON.parse(result);

  return result;
}

module.exports = create;
