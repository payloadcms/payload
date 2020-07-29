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
  } = args;

  let { data } = args;

  // /////////////////////////////////////
  // 1. Retrieve and execute access
  // /////////////////////////////////////

  await executeAccess({ req }, collectionConfig.access.create);

  // /////////////////////////////////////
  // 2. Execute field-level access, hooks, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeCreate',
    operationName: 'create',
    req,
  });

  // /////////////////////////////////////
  // 3. Execute before collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeCreate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Upload and resize any files that may be present
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
  // 5. Perform database operation
  // /////////////////////////////////////

  let result = new Model();

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  Object.assign(result, data);
  await result.save();

  result = result.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 6. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterRead',
    operationName: 'read',
    req,
    depth,
  });

  // /////////////////////////////////////
  // 7. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterCreate.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req: args.req,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 8. Return results
  // /////////////////////////////////////

  return result;
}

module.exports = create;
