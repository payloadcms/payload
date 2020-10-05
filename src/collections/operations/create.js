const mkdirp = require('mkdirp');
const path = require('path');
const crypto = require('crypto');

const executeAccess = require('../../auth/executeAccess');

const { MissingFile } = require('../../errors');
const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');
const getImageSize = require('../../uploads/getImageSize');
const imageMIMETypes = require('../../uploads/imageMIMETypes');

const sendVerificationEmail = require('../../auth/sendVerificationEmail');

async function create(args) {
  const { performFieldOperations, config } = this;

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
  // 2. Execute beforeValidate field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    hook: 'beforeValidate',
    operation: 'create',
    overrideAccess,
  });

  // /////////////////////////////////////
  // 3. Execute beforeValidate collection hooks
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
  // 4. Execute field-level access, beforeChange hooks, and validation
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    hook: 'beforeChange',
    operation: 'create',
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 5. Execute beforeChange collection hooks
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
  // 6. Upload and resize any files that may be present
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

    await file.mv(`${staticPath}/${fsSafeName}`);

    if (imageMIMETypes.indexOf(file.mimetype) > -1) {
      const dimensions = await getImageSize(`${staticPath}/${fsSafeName}`);
      fileData.width = dimensions.width;
      fileData.height = dimensions.height;

      if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
        fileData.sizes = await resizeAndSave(staticPath, collectionConfig, fsSafeName, fileData.mimeType);
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
  // 7. Perform database operation
  // /////////////////////////////////////

  let result = new Model();

  if (locale && result.setLocale) {
    result.setLocale(locale, fallbackLocale);
  }

  if (collectionConfig.auth) {
    if (data.email) {
      data.email = data.email.toLowerCase();
    }
    if (collectionConfig.auth.emailVerification) {
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

  // /////////////////////////////////////
  // 8. Execute field-level hooks and access
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    overrideAccess,
    reduceLocales: true,
  });

  // /////////////////////////////////////
  // 9. Execute after collection hook
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
  // 10. Send verification email if applicable
  // /////////////////////////////////////

  if (collectionConfig.auth && collectionConfig.auth.emailVerification) {
    sendVerificationEmail({
      config: this.config,
      sendEmail: this.sendEmail,
      collection: { config: collectionConfig, Model },
      user: result,
      req,
    });
  }

  // /////////////////////////////////////
  // 11. Return results
  // /////////////////////////////////////

  result = JSON.stringify(result);
  result = JSON.parse(result);

  return result;
}

module.exports = create;
