import httpStatus from 'http-status';
import deepmerge from 'deepmerge';
import merge from 'lodash.merge';
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import { Where, Document } from '../../types';
import { Collection } from '../config/types';

import removeInternalFields from '../../utilities/removeInternalFields';
import overwriteMerge from '../../utilities/overwriteMerge';
import executeAccess from '../../auth/executeAccess';
import { NotFound, Forbidden, APIError, FileUploadError } from '../../errors';
import isImage from '../../uploads/isImage';
import getImageSize from '../../uploads/getImageSize';
import getSafeFilename from '../../uploads/getSafeFilename';

import resizeAndSave from '../../uploads/imageResizer';
import { FileData } from '../../uploads/types';

import { PayloadRequest } from '../../express/types';
import { hasWhereAccessResult, UserDocument } from '../../auth/types';

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  id: string
  data: Record<string, unknown>
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function update(incomingArgs: Arguments): Promise<Document> {
  const { performFieldOperations, config } = this;

  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
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
  const hasWherePolicy = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: { where: Where } = {
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

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  const doc = await Model.findOne(query) as UserDocument;

  if (!doc && !hasWherePolicy) throw new NotFound();
  if (!doc && hasWherePolicy) throw new Forbidden();

  if (locale && doc.setLocale) {
    doc.setLocale(locale, null);
  }

  let originalDoc: Document = doc.toJSON({ virtuals: true });

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

    const file = ((req.files && req.files.file) ? req.files.file : req.file) as UploadedFile;

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
    await doc.setPassword(password as string);
    delete data.password;
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  merge(doc, data);

  await doc.save();

  if (locale && doc.setLocale) {
    doc.setLocale(locale, fallbackLocale);
  }

  let result: Document = doc.toJSON({ virtuals: true });

  result = removeInternalFields(result);
  result = JSON.stringify(result);
  result = JSON.parse(result);

  // /////////////////////////////////////
  // afterChange - Fields
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    data: result,
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

    result = await hook({
      doc: result,
      req,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await performFieldOperations(collectionConfig, {
    depth,
    req,
    data: result,
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

export default update;
