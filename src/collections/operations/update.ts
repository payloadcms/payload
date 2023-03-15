import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { Where, Document } from '../../types';
import { Collection } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { NotFound, Forbidden, APIError, ValidationError, ErrorDeletingFile } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { hasWhereAccessResult } from '../../auth/types';
import { saveVersion } from '../../versions/saveVersion';
import { uploadFiles } from '../../uploads/uploadFiles';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { generateFileData } from '../../uploads/generateFileData';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion';
import { mapAsync } from '../../utilities/mapAsync';
import fileExists from '../../uploads/fileExists';
import { FileData } from '../../uploads/types';

const unlinkFile = promisify(fs.unlink);

export type Arguments<T extends { [field: string | number | symbol]: unknown }> = {
  collection: Collection
  req: PayloadRequest
  id: string | number
  data: Partial<T>
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

async function update<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<GeneratedTypes['collections'][TSlug]> {
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
    collection,
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    req,
    req: {
      t,
      locale,
      payload,
      payload: {
        config,
      },
    },
    overrideAccess,
    showHiddenFields,
    overwriteExistingFiles = false,
    draft: draftArg = false,
    autosave = false,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST);
  }

  let { data } = args;
  const { password } = data;
  const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);
  const shouldSavePassword = Boolean(password && collectionConfig.auth && !shouldSaveDraft);
  const lean = !shouldSavePassword;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id, data }, collectionConfig.access.update) : true;
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

  const doc = await getLatestCollectionVersion({
    payload,
    Model,
    config: collectionConfig,
    id,
    query,
    lean,
  });

  if (!doc && !hasWherePolicy) throw new NotFound(t);
  if (!doc && hasWherePolicy) throw new Forbidden(t);

  let docWithLocales: Document = JSON.stringify(lean ? doc : doc.toJSON({ virtuals: true }));
  docWithLocales = JSON.parse(docWithLocales);

  const originalDoc = await afterRead({
    depth: 0,
    doc: docWithLocales,
    entityConfig: collectionConfig,
    req,
    overrideAccess: true,
    showHiddenFields: true,
  });

  // /////////////////////////////////////
  // Generate data for all files and sizes
  // /////////////////////////////////////

  const { data: newFileData, files: filesToUpload } = await generateFileData({
    config,
    collection,
    req,
    data,
    throwOnMissingFile: false,
    overwriteExistingFiles,
  });

  data = newFileData;

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await beforeValidate<GeneratedTypes['collections'][TSlug]>({
    data,
    doc: originalDoc,
    entityConfig: collectionConfig,
    id,
    operation: 'update',
    overrideAccess,
    req,
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
  // Write files to local storage
  // /////////////////////////////////////

  if (!collectionConfig.upload.disableLocalStorage) {
    await uploadFiles(payload, filesToUpload, t);
  }

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
  // beforeChange - Fields
  // /////////////////////////////////////

  let result = await beforeChange<GeneratedTypes['collections'][TSlug]>({
    data,
    doc: originalDoc,
    docWithLocales,
    entityConfig: collectionConfig,
    id,
    operation: 'update',
    req,
    skipValidation: shouldSaveDraft || data._status === 'draft',
  });

  // /////////////////////////////////////
  // Handle potential password update
  // /////////////////////////////////////

  if (shouldSavePassword) {
    await doc.setPassword(password);
    await doc.save();
    delete data.password;
    delete result.password;
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  if (!shouldSaveDraft) {
    try {
      result = await Model.findByIdAndUpdate(
        { _id: id },
        result,
        { new: true },
      );
    } catch (error) {
      // Handle uniqueness error from MongoDB
      throw error.code === 11000 && error.keyValue
        ? new ValidationError([{ message: 'Value must be unique', field: Object.keys(error.keyValue)[0] }], t)
        : error;
    }
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id as string | number;
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Delete any associated files
  // /////////////////////////////////////

  if (collectionConfig.upload && filesToUpload && filesToUpload.length > 0) {
    const { staticDir } = collectionConfig.upload;

    const staticPath = path.resolve(config.paths.configDir, staticDir);

    const fileToDelete = `${staticPath}/${doc.filename}`;

    if (await fileExists(fileToDelete)) {
      fs.unlink(fileToDelete, (err) => {
        if (err) {
          throw new ErrorDeletingFile(t);
        }
      });
    }

    if (doc.sizes) {
      Object.values(doc.sizes).forEach(async (size: FileData) => {
        const sizeToDelete = `${staticPath}/${size.filename}`;
        if (await fileExists(sizeToDelete)) {
          fs.unlink(sizeToDelete, (err) => {
            if (err) {
              throw new ErrorDeletingFile(t);
            }
          });
        }
      });
    }
  }

  // /////////////////////////////////////
  // Create version
  // /////////////////////////////////////

  if (collectionConfig.versions) {
    result = await saveVersion({
      payload,
      collection: collectionConfig,
      req,
      docWithLocales: {
        ...result,
        createdAt: docWithLocales.createdAt,
      },
      id,
      autosave,
      draft: shouldSaveDraft,
    });
  }

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await afterRead({
    depth,
    doc: result,
    entityConfig: collectionConfig,
    req,
    overrideAccess,
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
  // afterChange - Fields
  // /////////////////////////////////////

  result = await afterChange<GeneratedTypes['collections'][TSlug]>({
    data,
    doc: result,
    previousDoc: originalDoc,
    entityConfig: collectionConfig,
    operation: 'update',
    req,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      previousDoc: originalDoc,
      req,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  // Remove temp files if enabled, as express-fileupload does not do this automatically
  if (config.upload?.useTempFiles && collectionConfig.upload) {
    const { files } = req;
    const fileArray = Array.isArray(files) ? files : [files];
    await mapAsync(fileArray, async ({ file }) => {
      // Still need this check because this will not be populated if using local API
      if (file.tempFilePath) {
        await unlinkFile(file.tempFilePath);
      }
    });
  }
  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default update;
