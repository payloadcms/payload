const mkdirp = require('mkdirp');

const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');
const { validateCreate } = require('../../fields/validateCreate');

const { MissingFile } = require('../../errors');
const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');

const create = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.create);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Validate incoming data
    // /////////////////////////////////////

    await validateCreate(args.data, args.config.fields);

    // /////////////////////////////////////
    // 3. Execute before create field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(options, args.config.fields, args.data, 'beforeCreate', args.data);


    // /////////////////////////////////////
    // 4. Upload and resize any files that may be present
    // /////////////////////////////////////

    if (args.config.upload) {
      const fileData = {};

      if (!args.req.files || Object.keys(args.req.files).length === 0) {
        throw new MissingFile();
      }

      const { staticDir, imageSizes } = options.req.collection.config.upload;

      try {
        await mkdirp(staticDir);
        const fsSafeName = await getSafeFilename(staticDir, options.req.files.file.name);

        try {
          await options.req.files.file.mv(`${staticDir}/${fsSafeName}`);

          fileData.filename = fsSafeName;

          if (imageSizes) {
            fileData.sizes = await resizeAndSave(options.config, fsSafeName);
          }

          options.data = {
            ...options.data,
            ...fileData,
          };
        } catch (error) {
          throw error;
        }
      } catch (err) {
        throw err;
      }
    }

    // /////////////////////////////////////
    // 5. Execute before collection hook
    // /////////////////////////////////////

    const { beforeCreate } = args.config.hooks;

    if (typeof beforeCreate === 'function') {
      options = await beforeCreate(options);
    }

    // /////////////////////////////////////
    // 6. Perform database operation
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
    // 7. Execute after collection hook
    // /////////////////////////////////////

    const { afterCreate } = args.config.hooks;

    if (typeof afterCreate === 'function') {
      result = await afterCreate(options, result);
    }

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = create;
