import type { Config as GeneratedTypes } from 'payload/generated-types';
import type { DeepPartial } from 'ts-essentials';

import httpStatus from 'http-status';

import type { FindOneArgs } from '../../database/types';
import type { PayloadRequest } from '../../express/types';
import type { Collection } from '../config/types';

import executeAccess from '../../auth/executeAccess';
import { generatePasswordSaltHash } from '../../auth/strategies/local/generatePasswordSaltHash';
import { hasWhereAccessResult } from '../../auth/types';
import { combineQueries } from '../../database/combineQueries';
import { APIError, Forbidden, NotFound } from '../../errors';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';
import { generateFileData } from '../../uploads/generateFileData';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles';
import { uploadFiles } from '../../uploads/uploadFiles';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion';
import { saveVersion } from '../../versions/saveVersion';
import { buildAfterOperation } from './utils';

export type Arguments<T extends { [field: number | string | symbol]: unknown }> = {
  autosave?: boolean
  collection: Collection
  data: DeepPartial<T>
  depth?: number
  disableVerificationEmail?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
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
      context: args.req.context,
      operation: 'update',
    })) || args;
  }, Promise.resolve());

  const {
    autosave = false,
    collection: {
      config: collectionConfig,
    },
    collection,
    depth,
    draft: draftArg = false,
    id,
    overrideAccess,
    overwriteExistingFiles = false,
    req: {
      locale,
      payload: {
        config,
      },
      payload,
      t,
    },
    req,
    showHiddenFields,
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
        context: req.context,
        operation: 'update',
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

    const accessResults = !overrideAccess ? await executeAccess({ data, id, req }, collectionConfig.access.update) : true;
    const hasWherePolicy = hasWhereAccessResult(accessResults);

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////


    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale,
      where: combineQueries({ id: { equals: id } }, accessResults),
    };

    const docWithLocales = await getLatestCollectionVersion({
      config: collectionConfig,
      id,
      payload,
      query: findOneArgs,
      req,
    });

    if (!docWithLocales && !hasWherePolicy) throw new NotFound(t);
    if (!docWithLocales && hasWherePolicy) throw new Forbidden(t);


    const originalDoc = await afterRead({
      context: req.context,
      depth: 0,
      doc: docWithLocales,
      entityConfig: collectionConfig,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    });

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
      overwriteExistingFiles,
      req,
      throwOnMissingFile: false,
    });

    data = newFileData;

    // /////////////////////////////////////
    // Delete any associated files
    // /////////////////////////////////////

    await deleteAssociatedFiles({ collectionConfig, config, doc: docWithLocales, files: filesToUpload, overrideDelete: false, t });

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate<DeepPartial<GeneratedTypes['collections'][TSlug]>>({
      context: req.context,
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
        context: req.context,
        data,
        operation: 'update',
        originalDoc,
        req,
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
        context: req.context,
        data,
        operation: 'update',
        originalDoc,
        req,
      })) || data;
    }, Promise.resolve());

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    let result = await beforeChange<GeneratedTypes['collections'][TSlug]>({
      context: req.context,
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
        data: dataToUpdate,
        id,
        locale,
        req,
      });
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      result = await saveVersion({
        autosave,
        collection: collectionConfig,
        docWithLocales: {
          ...result,
          createdAt: docWithLocales.createdAt,
        },
        draft: shouldSaveDraft,
        id,
        payload,
        req,
      });
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      context: req.context,
      depth,
      doc: result,
      entityConfig: collectionConfig,
      overrideAccess,
      req,
      showHiddenFields,
    });

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        context: req.context,
        doc: result,
        req,
      }) || result;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange<GeneratedTypes['collections'][TSlug]>({
      context: req.context,
      data,
      doc: result,
      entityConfig: collectionConfig,
      operation: 'update',
      previousDoc: originalDoc,
      req,
    });

    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        context: req.context,
        doc: result,
        operation: 'update',
        previousDoc: originalDoc,
        req,
      }) || result;
    }, Promise.resolve());

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      operation: 'updateByID',
      result,
    });

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
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
