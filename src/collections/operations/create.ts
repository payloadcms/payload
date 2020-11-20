const mkdirp = require('mkdirp');
const path = require('path');
const crypto = require('crypto');

const executeAccess = require('../../auth/executeAccess');
const removeInternalFields = require('../../utilities/removeInternalFields');

const { MissingFile, FileUploadError } = require('../../errors');
const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');
const getImageSize = require('../../uploads/getImageSize');
const imageMIMETypes = require('../../uploads/imageMIMETypes');

const sendVerificationEmail = require('../../auth/sendVerificationEmail');

async function create(incomingArgs) {
  const { performFieldOperations, config } = this;

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'create',
    })) || args;
  }, Promise.resolve());

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
    disableVerificationEmail,
    depth,
    overrideAccess,
    showHiddenFields,
  } = args;

  let { data } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  if (!overrideAccess) {
    await executeAccess({ req }, collectionConfig.access.create);
  }

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    hook: 'beforeValidate',
    operation: 'create',
    overrideAccess,
  });

  // /////////////////////////////////////
  // beforeValidate - Collections
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
  // beforeChange - Fields
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeChange',
    operation: 'create',
    req,
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
      operation: 'create',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Upload and resize potential files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    const file = (req.files && req.files.file) ? req.files.file : req.file;

    if (!file) {
      throw new MissingFile();
    }

    let staticPath = staticDir;

    if (staticDir.indexOf('/') !== 0) {
      staticPath = path.join(config.paths.configDir, staticDir);
    }

    mkdirp.sync(staticPath);

    const fsSafeName = await getSafeFilename(staticPath, file.name);

    try {
      await file.mv(`${staticPath}/${fsSafeName}`);

      if (imageMIMETypes.indexOf(file.mimetype) > -1) {
        const dimensions = await getImageSize(`${staticPath}/${fsSafeName}`);
        fileData.width = dimensions.width;
        fileData.height = dimensions.height;

        if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
          fileData.sizes = await resizeAndSave(staticPath, collectionConfig, fsSafeName, fileData.mimeType);
        }
      }
    } catch (err) {
      console.error(err);
      throw new FileUploadError(err);
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
  // Create
  // /////////////////////////////////////

  let result = new Model();

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  if (collectionConfig.auth) {
    if (data.email) {
      data.email = data.email.toLowerCase();
    }
    if (collectionConfig.auth.verify) {
      data._verified = false;
      data._verificationToken = crypto.randomBytes(20).toString('hex');
    }
  }

  Object.assign(result, data);

  if (collectionConfig.auth) {
    result = await Model.register(result, data.password);
  } else {
    await result.save();
  }

  result = result.toJSON({ virtuals: true });

  result = removeInternalFields(result);
  result = JSON.stringify(result);
  result = JSON.parse(result);

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterChange',
    operation: 'create',
    req,
    depth,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterChange - Collection
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
  // Send verification email if applicable
  // /////////////////////////////////////

  if (collectionConfig.auth && collectionConfig.auth.verify && !disableVerificationEmail) {
    sendVerificationEmail({
      config: this.config,
      sendEmail: this.sendEmail,
      collection: { config: collectionConfig, Model },
      user: result,
      token: data._verificationToken,
      req,
    });
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'create',
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
  // Return results
  // /////////////////////////////////////

  return result;
}

module.exports = create;
