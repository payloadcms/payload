import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Document } from '../../types';
import { AfterChangeHook, AfterReadHook, BeforeChangeHook, BeforeValidateHook, Collection, CollectionSlug, Collections } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { NotFound, Forbidden, APIError, ValidationError } from '../../errors';
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

type UpdateByIDArgs<TSlug extends CollectionSlug> = {
  collection: Collection;
  req: PayloadRequest;
  id: string | number;
  data: DeepPartial<Collections[TSlug]>;
  depth?: number;
  disableVerificationEmail?: boolean;
  overrideAccess?: boolean;
  showHiddenFields?: boolean;
  overwriteExistingFiles?: boolean;
  draft?: boolean;
  autosave?: boolean;
};

async function updateByID<TSlug extends CollectionSlug>(
  incomingArgs: UpdateByIDArgs<TSlug>,
): Promise<Collections[TSlug]> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'update',
      context: req.payloadContext,
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

  const query = await Model.buildQuery({
    where: {
      id: {
        equals: id,
      },
    },
    access: accessResults,
    req,
    overrideAccess,
  });

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
    context: req.payloadContext,
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

  await deleteAssociatedFiles({ config, collectionConfig, files: filesToUpload, doc, t, overrideDelete: false });

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
    context: req.payloadContext,
  });

  // /////////////////////////////////////
  // beforeValidate - Collection
  // /////////////////////////////////////
  await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook: BeforeValidateHook<Collections[TSlug]>) => {
    await priorHook;

    const result = await hook({
      data,
      req,
      operation: 'update',
      originalDoc,
      context: req.payloadContext,
    });

    // The result of the hook might be undefined, so we fall back to data
    data = result ?? data;
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

  await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook: BeforeChangeHook<Collections[TSlug]>) => {
    await priorHook;

    data = (await hook({
      data,
      req,
      originalDoc,
      operation: 'update',
      context: req.payloadContext,
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
    context: req.payloadContext,
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
    try {
      result = await Model.findByIdAndUpdate(
        { _id: id },
        dataToUpdate,
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
    context: req.payloadContext,
  }) as Collections[TSlug];


  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook: AfterReadHook) => { // TODO: Improve typing
    await priorHook;

    result = await hook({
      req,
      doc: result,
      context: req.payloadContext,
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
    context: req.payloadContext,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook: AfterChangeHook) => { // TODO: Improve typing
    await priorHook;

    result = await hook({
      doc: result,
      previousDoc: originalDoc,
      req,
      operation: 'update',
      context: req.payloadContext,
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
