import httpStatus from 'http-status';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Where } from '../../types';
import { BulkOperationResult, Collection } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import executeAccess from '../../auth/executeAccess';
import { APIError } from '../../errors';
import { PayloadRequest } from '../../express/types';
import { saveVersion } from '../../versions/saveVersion';
import { uploadFiles } from '../../uploads/uploadFiles';
import { beforeChange } from '../../fields/hooks/beforeChange';
import { beforeValidate } from '../../fields/hooks/beforeValidate';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { generateFileData } from '../../uploads/generateFileData';
import { AccessResult } from '../../config/types';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths';
import { combineQueries } from '../../database/combineQueries';
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields';

export type Arguments<T extends { [field: string | number | symbol]: unknown }> = {
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

  if (!where) {
    throw new APIError('Missing \'where\' query of documents to update.', httpStatus.BAD_REQUEST);
  }

  let { data } = args;
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
    });

    docs = query.docs;
  } else {
    const query = await payload.db.find({
      locale,
      collection: collectionConfig.slug,
      where: fullWhere,
      pagination: false,
      limit: 0,
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
    data,
    throwOnMissingFile: false,
    overwriteExistingFiles,
  });

  data = newFileData;

  const errors = [];

  const promises = docs.map(async (doc) => {
    const { id } = doc;

    try {
      const originalDoc = await afterRead({
        depth: 0,
        doc,
        entityConfig: collectionConfig,
        req,
        overrideAccess: true,
        showHiddenFields: true,
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
        docWithLocales: doc,
        entityConfig: collectionConfig,
        id,
        operation: 'update',
        req,
        skipValidation: shouldSaveDraft || data._status === 'draft',
      });

      // /////////////////////////////////////
      // Update
      // /////////////////////////////////////

      if (!shouldSaveDraft) {
        result = await req.payload.db.updateOne({
          collection: collectionConfig.slug,
          locale,
          where: { id: { equals: id } },
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
    } catch (error) {
      errors.push({
        message: error.message,
        id,
      });
    }
    return null;
  });

  const awaitedDocs = await Promise.all(promises);

  return {
    docs: awaitedDocs.filter(Boolean),
    errors,
  };
}

export default update;
