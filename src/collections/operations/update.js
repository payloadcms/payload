const executePolicy = require('../../auth/executePolicy');
const { NotFound, Forbidden } = require('../../errors');
const performFieldOperations = require('../../fields/performFieldOperations');

const resizeAndSave = require('../../uploads/imageResizer');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policyResults = await executePolicy(args, args.config.policies.update);
    const hasWherePolicy = typeof policyResults === 'object';

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before update hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Execute field-level hooks, policies, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

    // /////////////////////////////////////
    // 4. Perform database operation
    // /////////////////////////////////////

    let {
      data,
    } = options;

    const {
      Model,
      id,
      req: {
        locale,
        fallbackLocale,
      },
    } = options;

    let query = { _id: id };

    if (hasWherePolicy) {
      query = {
        ...query,
        ...policyResults,
      };
    }

    let result = await Model.findOne(query);

    if (!result && !hasWherePolicy) throw new NotFound();
    if (!result && hasWherePolicy) throw new Forbidden();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    // /////////////////////////////////////
    // 5. Upload and resize any files that may be present
    // /////////////////////////////////////

    if (args.config.upload) {
      const fileData = {};

      const { staticDir, imageSizes } = args.config.upload;

      if (args.req.files || args.req.files.file) {
        await options.req.files.file.mv(`${staticDir}/${options.req.files.file.name}`);

        fileData.filename = options.req.files.file.name;

        if (imageSizes) {
          fileData.sizes = await resizeAndSave(options.config, options.req.files.file.name);
        }

        data = {
          ...data,
          ...fileData,
        };
      }
    }

    Object.assign(result, data);

    await result.save();

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 6. Execute field-level hooks and policies
    // /////////////////////////////////////

    result = await performFieldOperations(args.config, {
      ...options, data: result, hook: 'afterRead', operationName: 'read',
    });

    // /////////////////////////////////////
    // 7. Execute after collection hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      result = await afterUpdate(options, result);
    }

    // /////////////////////////////////////
    // 7. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = update;
