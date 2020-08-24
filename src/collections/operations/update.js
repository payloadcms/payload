const httpStatus = require('http-status');
const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeAccess = require('../../auth/executeAccess');
const { NotFound, Forbidden, APIError } = require('../../errors');
const imageMIMETypes = require('../../uploads/imageMIMETypes');
const getImageSize = require('../../uploads/getImageSize');
const getSafeFilename = require('../../uploads/getSafeFilename');

const resizeAndSave = require('../../uploads/imageResizer');

async function update(args) {
  const {
    depth,
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    req,
    req: {
      locale,
      fallbackLocale,
    },
    overrideAccess,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // 1. Execute access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.update) : true;
  const hasWherePolicy = typeof accessResults === 'object';

  // /////////////////////////////////////
  // 2. Retrieve document
  // /////////////////////////////////////

  const queryToBuild = {
    where: {
      and: [
        {
          id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWherePolicy) {
    queryToBuild.where.and.push(hasWherePolicy);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  let doc = await Model.findOne(query);

  if (!doc && !hasWherePolicy) throw new NotFound();
  if (!doc && hasWherePolicy) throw new Forbidden();

  if (locale && doc.setLocale) {
    doc.setLocale(locale, fallbackLocale);
  }

  let originalDoc = doc.toJSON({ virtuals: true });

  originalDoc = JSON.stringify(originalDoc);
  originalDoc = JSON.parse(originalDoc);

  let { data } = args;

  // /////////////////////////////////////
  // 3. Execute before validate collection hooks
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'update',
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeChange',
    operation: 'update',
    overrideAccess,
  });

  // /////////////////////////////////////
  // 5. Execute before update hook
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(originalDoc, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 7. Upload and resize any files that may be present
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    const file = (req.files && req.files.file) ? req.files.file : req.fileData;

    if (file) {
      const fsSafeName = await getSafeFilename(staticDir, file.name);

      await file.mv(`${staticDir}/${fsSafeName}`);

      fileData.filename = fsSafeName;
      fileData.filesize = file.size;
      fileData.mimeType = file.mimetype;

      if (imageMIMETypes.indexOf(file.mimetype) > -1) {
        const dimensions = await getImageSize(`${staticDir}/${fsSafeName}`);
        fileData.width = dimensions.width;
        fileData.height = dimensions.height;

        if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
          fileData.sizes = await resizeAndSave(collectionConfig, fsSafeName, fileData.mimeType);
        }
      }

      data = {
        ...data,
        ...fileData,
      };
    } else if (data.file === null) {
      data = {
        ...data,
        filename: null,
        sizes: null,
      };
    }
  }

  // /////////////////////////////////////
  // 8. Perform database operation
  // /////////////////////////////////////

  Object.assign(doc, data);

  await doc.save();

  doc = doc.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 9. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = await this.performFieldOperations(collectionConfig, {
    data: doc,
    hook: 'afterRead',
    operation: 'read',
    req,
    id,
    depth,
    overrideAccess,
  });

  // /////////////////////////////////////
  // 10. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      doc,
      req,
      operation: 'update',
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 11. Return updated document
  // /////////////////////////////////////

  doc = JSON.stringify(doc);
  doc = JSON.parse(doc);

  return doc;
}

module.exports = update;
