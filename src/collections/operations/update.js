const deepmerge = require('deepmerge');
const overwriteMerge = require('../../utilities/overwriteMerge');
const executeAccess = require('../../auth/executeAccess');
const { NotFound, Forbidden } = require('../../errors');
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
  } = args;

  // /////////////////////////////////////
  // 1. Execute access
  // /////////////////////////////////////

  const policyResults = await executeAccess({ req }, collectionConfig.access.update);
  const hasWherePolicy = typeof policyResults === 'object';

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

  const originalDoc = doc.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 2. Execute before update hook
  // /////////////////////////////////////

  let { data } = args;

  await collectionConfig.hooks.beforeUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 3. Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(originalDoc, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // 4. Execute field-level hooks, access, and validation
  // /////////////////////////////////////

  data = await this.performFieldOperations(collectionConfig, {
    data,
    req,
    originalDoc,
    hook: 'beforeUpdate',
    operationName: 'update',
  });

  // /////////////////////////////////////
  // 5. Upload and resize any files that may be present
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    if (req.files && req.files.file) {
      const fsSafeName = await getSafeFilename(staticDir, req.files.file.name);

      await req.files.file.mv(`${staticDir}/${fsSafeName}`);

      fileData.filename = fsSafeName;
      fileData.filesize = req.files.file.size;
      fileData.mimeType = req.files.file.mimetype;

      if (imageMIMETypes.indexOf(req.files.file.mimetype) > -1) {
        const dimensions = await getImageSize(`${staticDir}/${fsSafeName}`);
        fileData.width = dimensions.width;
        fileData.height = dimensions.height;

        if (Array.isArray(imageSizes) && req.files.file.mimetype !== 'image/svg+xml') {
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
  // 6. Perform database operation
  // /////////////////////////////////////

  Object.assign(doc, data);

  await doc.save();

  doc = doc.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // 7. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = await this.performFieldOperations(collectionConfig, {
    data: doc,
    hook: 'afterRead',
    operationName: 'read',
    req,
    depth,
  });

  // /////////////////////////////////////
  // 8. Execute after collection hook
  // /////////////////////////////////////

  await collectionConfig.hooks.afterUpdate.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      doc,
      req,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 9. Return updated document
  // /////////////////////////////////////

  return doc;
}

module.exports = update;
