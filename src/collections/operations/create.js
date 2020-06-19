const mkdirp = require('mkdirp');

const executePolicy = require('../../auth/executePolicy');

const { MissingFile } = require('../../errors');
const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');

const performFieldOperations = require('../../fields/performFieldOperations');

const create = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.create);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before collection hook
    // /////////////////////////////////////

    const { beforeCreate } = args.config.hooks;

    if (typeof beforeCreate === 'function') {
      options = await beforeCreate(options);
    }

    // /////////////////////////////////////
    // 3. Execute field-level policies, hooks, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeCreate', operationName: 'create' });

    // /////////////////////////////////////
    // 4. Upload and resize any files that may be present
    // /////////////////////////////////////

    if (args.config.upload) {
      const { staticDir, imageSizes } = options.req.collection.config.upload;

      const fileData = {};

      if (!args.req.files || Object.keys(args.req.files).length === 0) {
        throw new MissingFile();
      }

      await mkdirp(staticDir);

      const fsSafeName = await getSafeFilename(staticDir, options.req.files.file.name);

      await options.req.files.file.mv(`${staticDir}/${fsSafeName}`);

      fileData.filename = fsSafeName;
      fileData.filesize = options.req.files.file.size;
      fileData.mimeType = options.req.files.file.mimetype;

      if (imageSizes) {
        fileData.sizes = await resizeAndSave(options.config, fsSafeName, fileData.mimeType);
      }

      options.data = {
        ...options.data,
        ...fileData,
      };
    }

    // /////////////////////////////////////
    // 5. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      data,
      req: {
        locale,
        fallbackLocale,
      },
    } = options;

    let result = new Model();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    Object.assign(result, data);
    await result.save();

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 6. Execute after collection hook
    // /////////////////////////////////////

    const { afterCreate } = args.config.hooks;

    if (typeof afterCreate === 'function') {
      result = await afterCreate(options, result);
    }

    // /////////////////////////////////////
    // 7. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = create;
