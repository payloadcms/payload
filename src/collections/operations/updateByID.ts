import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Collection } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { APIError, Forbidden, NotFound } from '../../errors';
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
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles';
import { generatePasswordSaltHash } from '../../auth/strategies/local/generatePasswordSaltHash';
import { combineQueries } from '../../database/combineQueries';
import { FindArgs } from '../../database/types';

export type Arguments<T extends { [field: string | number | symbol]: unknown }> = {
  collection: Collection
  req: PayloadRequest
  id: string | number
  data: DeepPartial<T>
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  overwriteExistingFiles?: boolean
  draft?: boolean
  autosave?: boolean
}

async function updateByID<TSlug extends keyof GeneratedTypes['collections']>(
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

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id, data }, collectionConfig.access.update) : true;
  const hasWherePolicy = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////


  const findArgs: FindArgs = {
    collection: collectionConfig.slug,
    where: combineQueries({ id: { equals: id } }, accessResults),
    locale: req.locale,
    limit: 1,
  };

  const docWithLocales = await getLatestCollectionVersion({
    payload,
    config: collectionConfig,
    id,
    query: findArgs,
  });

  if (!docWithLocales && !hasWherePolicy) throw new NotFound(t);
  if (!docWithLocales && hasWherePolicy) throw new Forbidden(t);


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
  // Delete any associated files
  // /////////////////////////////////////

  await deleteAssociatedFiles({ config, collectionConfig, files: filesToUpload, doc: docWithLocales, t, overrideDelete: false });

  // /////////////////////////////////////
  // beforeValidate - Fields
  // /////////////////////////////////////

  data = await beforeValidate<DeepPartial<GeneratedTypes['collections'][TSlug]>>({
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

  const dataToUpdate: Record<string, unknown> = { ...result };

  if (shouldSavePassword && typeof password === 'string') {
    const { hash, salt } = await generatePasswordSaltHash({ password });
    dataToUpdate.salt = salt;
    dataToUpdate.hash = hash;
    delete data.password;
    delete result.password;
  }

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  if (!shouldSaveDraft) {
    result = await req.payload.db.updateOne({
      collection: collectionConfig.slug,
      locale,
      id: `${id}`,
      data: dataToUpdate,
    });
  }

  result = JSON.parse(JSON.stringify(result));
  result.id = result._id as string | number;
  result = sanitizeInternalFields(result);

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

  await unlinkTempFiles({
    req,
    config,
    collectionConfig,
  });

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default updateByID;
