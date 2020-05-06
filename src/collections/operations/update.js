const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');
const { NotFound } = require('../../errors');
const validate = require('../../fields/validateUpdate');

const resizeAndSave = require('../../uploads/imageResizer');
const getSafeFilename = require('../../uploads/getSafeFilename');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.update);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Validate incoming data
    // /////////////////////////////////////

    await validate(args.data, args.config.fields);

    // /////////////////////////////////////
    // 3. Execute before update field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(options, args.config.fields, args.data, 'beforeUpdate', args.data);

    // /////////////////////////////////////
    // 4. Execute before collection hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 5. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      id,
      req: {
        locale,
        fallbackLocale,
      },
      data,
    } = options;

    let result = await Model.findOne({ _id: id });

    if (!result) throw new NotFound();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    // /////////////////////////////////////
    // 6. Upload and resize any files that may be present
    // /////////////////////////////////////

    if (args.config.upload) {
      const fileData = {};

      const { staticDir, imageSizes } = args.config.upload;

      if (args.req.files || args.req.files.file) {
        const fsSafeName = await getSafeFilename(staticDir, options.req.files.file.name);

        try {
          await options.req.files.file.mv(`${staticDir}/${fsSafeName}`);

          fileData.filename = fsSafeName;

          if (imageSizes) {
            fileData.sizes = await resizeAndSave(options.config, fsSafeName);
          }
        } catch (error) {
          throw error;
        }
      }

      options.data = {
        ...options.data,
        ...fileData,
      };
    }

    Object.assign(result, data);

    await result.save();

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 7. Execute after collection hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      result = await afterUpdate(options, result);
    }

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = update;
