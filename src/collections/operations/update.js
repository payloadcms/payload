const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executePolicy = require('../../auth/executePolicy');
const { NotFound, Forbidden } = require('../../errors');
const performFieldOperations = require('../../fields/performFieldOperations');
const imageMIMETypes = require('../../uploads/imageMIMETypes');
const getImageSize = require('../../uploads/getImageSize');
const getSafeFilename = require('../../uploads/getSafeFilename');

const resizeAndSave = require('../../uploads/imageResizer');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Execute policy
    // /////////////////////////////////////

    const policyResults = await executePolicy(args, args.config.policies.update);
    const hasWherePolicy = typeof policyResults === 'object';

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Retrieve document
    // /////////////////////////////////////

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

    let doc = await Model.findOne(query);

    if (!doc && !hasWherePolicy) throw new NotFound();
    if (!doc && hasWherePolicy) throw new Forbidden();

    if (locale && doc.setLocale) {
      doc.setLocale(locale, fallbackLocale);
    }

    const docJSON = doc.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 2. Execute before update hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Merge updates into existing data
    // /////////////////////////////////////

    options.data = deepmerge(docJSON, options.data, { arrayMerge: overwriteMerge });

    // /////////////////////////////////////
    // 4. Execute field-level hooks, policies, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

    // /////////////////////////////////////
    // 5. Upload and resize any files that may be present
    // /////////////////////////////////////

    if (args.config.upload) {
      const fileData = {};

      const { staticDir, imageSizes } = args.config.upload;

      if (options.req.files && options.req.files.file) {
        const fsSafeName = await getSafeFilename(staticDir, options.req.files.file.name);

        await options.req.files.file.mv(`${staticDir}/${fsSafeName}`);

        fileData.filename = fsSafeName;
        fileData.filesize = options.req.files.file.size;
        fileData.mimeType = options.req.files.file.mimetype;

        if (imageMIMETypes.indexOf(options.req.files.file.mimetype) > -1) {
          const dimensions = await getImageSize(`${staticDir}/${fsSafeName}`);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;

          if (Array.isArray(imageSizes) && options.req.files.file.mimetype !== 'image/svg+xml') {
            fileData.sizes = await resizeAndSave(options.config, fsSafeName, fileData.mimeType);
          }
        }

        options.data = {
          ...options.data,
          ...fileData,
        };
      } else if (options.data.file === null) {
        options.data = {
          ...options.data,
          filename: null,
          sizes: null,
        };
      }
    }

    // /////////////////////////////////////
    // 6. Perform database operation
    // /////////////////////////////////////

    Object.assign(doc, options.data);

    await doc.save();

    doc = doc.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 7. Execute field-level hooks and policies
    // /////////////////////////////////////

    doc = await performFieldOperations(args.config, {
      ...options, data: doc, hook: 'afterRead', operationName: 'read',
    });

    // /////////////////////////////////////
    // 8. Execute after collection hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      doc = await afterUpdate(options, doc) || doc;
    }

    // /////////////////////////////////////
    // 7. Return updated document
    // /////////////////////////////////////

    return doc;
  } catch (err) {
    throw err;
  }
};

module.exports = update;
