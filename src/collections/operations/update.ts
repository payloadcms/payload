import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Document, Where } from '../../types';
import { BulkOperationResult, Collection } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { APIError, ValidationError } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { saveVersion } from '../../versions/saveVersion';
import { uploadFiles } from '../../uploads/uploadFiles';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { generateFileData } from '../../uploads/generateFileData';
import { AccessResult } from '../../config/types';
import { queryDrafts } from '../../versions/drafts/queryDrafts';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles';
import { buildAfterOperation } from './utils';
import { CreateUpdateType } from './create';

export type Arguments<T extends CreateUpdateType> = {
  collection: Collection
  req: PayloadRequest
  where: Where
  data: DeepPartial<T>
  depth?: number
  disableVerificationEmail?: boolean
  overrideAccess?: boolean
  showHiddenFields?: boolean
  overwriteExistingFiles?: boolean
  draft?: boolean
}
async function update<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<BulkOperationResult<TSlug>> {
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
      Model,
      config: collectionConfig,
    },
    where,
    req,
    req: {
      t,
      payload,
      payload: {
        config,
      },
    },
    overrideAccess,
    showHiddenFields,
    overwriteExistingFiles = false,
    draft: draftArg = false,
  } = args;

  if (!where) {
    throw new APIError('Missing \'where\' query of documents to update.', httpStatus.BAD_REQUEST);
  }

  const { data: bulkUpdateData } = args;
  const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts);

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let accessResult: AccessResult;

  if (!overrideAccess) {
    accessResult = await executeAccess({ req }, collectionConfig.access.update);
  }

  const query = await Model.buildQuery({
    where,
    access: accessResult,
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // Retrieve documents
  // /////////////////////////////////////
  let docs;

  if (collectionConfig.versions?.drafts && shouldSaveDraft) {
    docs = await queryDrafts<GeneratedTypes['collections'][TSlug]>({
      accessResult,
      collection,
      req,
      overrideAccess,
      payload,
      where: query,
    });
  } else {
    docs = await Model.find(query, {}, { lean: true });
  }

  // /////////////////////////////////////
  // Generate data for all files and sizes
  // /////////////////////////////////////

  const {
    data: newFileData,
    files: filesToUpload,
  } = await generateFileData({
    config,
    collection,
    req,
    data: bulkUpdateData,
    throwOnMissingFile: false,
    overwriteExistingFiles,
  });

  const errors = [];

  const promises = docs.map(async (doc) => {
    let data = {
      ...newFileData,
      ...bulkUpdateData,
    };
    let docWithLocales: Document = JSON.stringify(doc);
    docWithLocales = JSON.parse(docWithLocales);

    const id = docWithLocales._id;

    try {
      const originalDoc = await afterRead({
        depth: 0,
        doc: docWithLocales,
        entityConfig: collectionConfig,
        req,
        overrideAccess: true,
        showHiddenFields: true,
        context: req.context,
      });

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
            ? new ValidationError([{
              message: 'Value must be unique',
              field: Object.keys(error.keyValue)[0],
            }], t)
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

      await unlinkTempFiles({
        req,
        config,
        collectionConfig,
      });

      // /////////////////////////////////////
      // Return results
      // /////////////////////////////////////

      return result;
    } catch (error) {
      errors.push({
        message: error.message,
        id,
      });
    }
    return null;
  });

  const awaitedDocs = await Promise.all(promises);

  let result = {
    docs: awaitedDocs.filter(Boolean),
    errors,
  };

  // /////////////////////////////////////
  // afterOperation - Collection
  // /////////////////////////////////////

  result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
    operation: 'update',
    args,
    result,
  });

  return result;
}

export default update;
