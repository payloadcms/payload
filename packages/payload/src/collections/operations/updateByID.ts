import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Collection } from '../config/types.js';
import executeAccess from '../../auth/executeAccess.js';
import { APIError, Forbidden, NotFound } from '../../errors.js';
import { PayloadRequest } from '../../express/types.js';
import { hasWhereAccessResult } from '../../auth/types.js';
import { saveVersion } from '../../versions/saveVersion.js';
import { uploadFiles } from '../../uploads/uploadFiles.js';
import { beforeChange } from '../../fields/hooks/beforeChange.js';
import { beforeValidate } from '../../fields/hooks/beforeValidate.js';
import { afterChange } from '../../fields/hooks/afterChange.js';
import { afterRead } from '../../fields/hooks/afterRead.js';
import { generateFileData } from '../../uploads/generateFileData.js';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js';
import { buildAfterOperation } from './utils.js';
import { generatePasswordSaltHash } from '../../auth/strategies/local/generatePasswordSaltHash.js';
import { combineQueries } from '../../database/combineQueries.js';
import type { FindOneArgs } from '../../database/types.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

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
      context: args.req.context,
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

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook;

      args = (await hook({
        args,
        operation: 'update',
        context: req.context,
      })) || args;
    }, Promise.resolve());

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


    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      where: combineQueries({ id: { equals: id } }, accessResults),
      locale,
    };

    const docWithLocales = await getLatestCollectionVersion({
      payload,
      config: collectionConfig,
      id,
      query: findOneArgs,
      req,
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
      context: req.context,
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
      context: req.context,
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
        context: req.context,
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
        context: req.context,
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
      context: req.context,
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
        id,
        data: dataToUpdate,
        req,
      });
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
      context: req.context,
    });

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        req,
        doc: result,
        context: req.context,
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
      context: req.context,
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
        context: req.context,
      }) || result;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      operation: 'updateByID',
      args,
      result,
    });

    await unlinkTempFiles({
      req,
      config,
      collectionConfig,
    });

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default updateByID;
