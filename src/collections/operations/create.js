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
  // 2. Execute before collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeCreate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 3. Upload and resize any files that may be present
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const { staticDir, imageSizes } = collectionConfig.upload;

    const fileData = {};

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new MissingFile();
    }

    mkdirp.sync(staticDir);

    const fsSafeName = await getSafeFilename(staticDir, req.files.file.name);

    await req.files.file.mv(`${staticDir}/${fsSafeName}`);

    if (imageMIMETypes.indexOf(req.files.file.mimetype) > -1) {
      const dimensions = await getImageSize(`${staticDir}/${fsSafeName}`);
      fileData.width = dimensions.width;
      fileData.height = dimensions.height;

      if (Array.isArray(imageSizes) && req.files.file.mimetype !== 'image/svg+xml') {
        fileData.sizes = await resizeAndSave(collectionConfig, fsSafeName, fileData.mimeType);
      }
    }

    fileData.filename = fsSafeName;
    fileData.filesize = req.files.file.size;
    fileData.mimeType = req.files.file.mimetype;

    data = {
      ...data,
      ...fileData,
    };
  }

  // /////////////////////////////////////
  // 4. Execute field-level access, hooks, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeCreate',
    operationName: 'create',
    req,
  });

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
