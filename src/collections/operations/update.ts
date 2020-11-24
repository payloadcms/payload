import httpStatus from 'http-status';
import deepmerge from 'deepmerge';
import path from 'path';
import { BeforeOperationHook, BeforeChangeHook, BeforeValidateHook } from '../config/types';

import removeInternalFields from '../../utilities/removeInternalFields';
import overwriteMerge from '../../utilities/overwriteMerge';
import executeAccess from '../../auth/executeAccess';
import { NotFound, Forbidden, APIError, FileUploadError } from '../../errors';
import isImage from '../../uploads/isImage';
import getImageSize from '../../uploads/getImageSize';
import getSafeFilename from '../../uploads/getSafeFilename';

import resizeAndSave from '../../uploads/imageResizer';
import { FileData } from '../../uploads/types';


async function update(incomingArgs) {
  const { performFieldOperations, config } = this;

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook, hook: BeforeOperationHook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'update',
    })) || args;
  }, Promise.resolve());

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
    showHiddenFields,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.update) : true;
  const hasWherePolicy = typeof accessResults === 'object';

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: { [key: string]: any } = {
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
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeValidate',
    operation: 'update',
    overrideAccess,
  });

  // /////////////////////////////////////
  // beforeValidate - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook: BeforeValidateHook, hook: BeforeValidateHook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      operation: 'update',
      originalDoc,
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // beforeChange - Fields
  // /////////////////////////////////////

  data = await performFieldOperations(collectionConfig, {
    data,
    req,
    id,
    originalDoc,
    hook: 'beforeChange',
    operation: 'update',
    overrideAccess,
  });

  // /////////////////////////////////////
  // beforeChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook: BeforeChangeHook, hook: BeforeChangeHook) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
      operation: 'update',
    })) || data;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Merge updates into existing data
  // /////////////////////////////////////

  data = deepmerge(originalDoc, data, { arrayMerge: overwriteMerge });

  // /////////////////////////////////////
  // Upload and resize potential files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const fileData: Partial<FileData> = {};

    const { staticDir, imageSizes } = collectionConfig.upload;

    let staticPath = staticDir;

    if (staticDir.indexOf('/') !== 0) {
      staticPath = path.join(config.paths.configDir, staticDir);
    }

    const file = (req.files && req.files.file) ? req.files.file : req.fileData;

    if (file) {
      const fsSafeName = await getSafeFilename(staticPath, file.name);

      try {
        await file.mv(`${staticPath}/${fsSafeName}`);

        fileData.filename = fsSafeName;
        fileData.filesize = file.size;
        fileData.mimeType = file.mimetype;

        if (isImage(file.mimetype)) {
          const dimensions = await getImageSize(`${staticPath}/${fsSafeName}`);
          fileData.width = dimensions.width;
          fileData.height = dimensions.height;

          if (Array.isArray(imageSizes) && file.mimetype !== 'image/svg+xml') {
            fileData.sizes = await resizeAndSave(staticPath, collectionConfig, fsSafeName, fileData.mimeType);
          }
        }
      } catch (err) {
        throw new FileUploadError();
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
  // Handle potential password update
  // /////////////////////////////////////

  const { password } = data;

  if (password) {
    await doc.setPassword(password);
    delete data.password;
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  Object.assign(doc, data);

  await doc.save();

  doc = doc.toJSON({ virtuals: true });

  doc = removeInternalFields(doc);
  doc = JSON.stringify(doc);
  doc = JSON.parse(doc);

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  doc = await performFieldOperations(collectionConfig, {
    data: doc,
    hook: 'afterChange',
    operation: 'update',
    req,
    id,
    depth,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterChange - Collection
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
  // afterRead - Fields
  // /////////////////////////////////////

  doc = await performFieldOperations(collectionConfig, {
    depth,
    req,
    data: doc,
    hook: 'afterRead',
    operation: 'update',
    overrideAccess,
    reduceLocales: false,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return doc;
}

export default update;
