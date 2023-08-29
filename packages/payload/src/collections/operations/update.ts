import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Where } from '../../types/index.js';
import { BulkOperationResult, Collection } from '../config/types.js';
import executeAccess from '../../auth/executeAccess.js';
import { APIError } from '../../errors/index.js';
import { PayloadRequest } from '../../express/types.js';
import { saveVersion } from '../../versions/saveVersion.js';
import { uploadFiles } from '../../uploads/uploadFiles.js';
import { beforeChange } from '../../fields/hooks/beforeChange/index.js';
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { generateFileData } from '../../uploads/generateFileData.js';
import { AccessResult } from '../../config/types.js';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js';
import { combineQueries } from '../../database/combineQueries.js';
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { CreateUpdateType } from './create.js';
import { buildAfterOperation } from './utils.js';

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
      config: collectionConfig,
    },
    where,
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

    await validateQueryPaths({
      collectionConfig,
      where,
      req,
      overrideAccess,
    });

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const fullWhere = combineQueries(where, accessResult);

    let docs;

    if (collectionConfig.versions?.drafts && shouldSaveDraft) {
      const versionsWhere = appendVersionToQueryKey(fullWhere);

      await validateQueryPaths({
        collectionConfig: collection.config,
        where: versionsWhere,
        req,
        overrideAccess,
        versionFields: buildVersionCollectionFields(collection.config),
      });

      const query = await payload.db.queryDrafts<GeneratedTypes['collections'][TSlug]>({
        collection: collectionConfig.slug,
        where: versionsWhere,
        locale,
        req,
      });

      docs = query.docs;
    } else {
      const query = await payload.db.find({
        locale,
        collection: collectionConfig.slug,
        where: fullWhere,
        pagination: false,
        limit: 0,
        req,
      });

      docs = query.docs;
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
      const { id } = doc;
      let data = {
        ...newFileData,
        ...bulkUpdateData,
      };

      try {
        const originalDoc = await afterRead({
          depth: 0,
          doc,
          entityConfig: collectionConfig,
          req,
          overrideAccess: true,
          showHiddenFields: true,
          context: req.context,
        });

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
          docWithLocales: doc,
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
          result = await req.payload.db.updateOne({
            collection: collectionConfig.slug,
            locale,
            id,
            data: result,
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
              createdAt: doc.createdAt,
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
          context: req.context,
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

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default update;
