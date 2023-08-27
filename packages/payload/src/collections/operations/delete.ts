import { Config as GeneratedTypes } from 'payload/generated-types';
import httpStatus from 'http-status';
import { AccessResult } from '../../config/types.js';
import { PayloadRequest } from '../../express/types.js';
import { APIError } from '../../errors.js';
import executeAccess from '../../auth/executeAccess.js';
import { BeforeOperationHook, Collection } from '../config/types.js';
import { Where } from '../../types.js';
import { afterRead } from '../../fields/hooks/afterRead.js';
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js';
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js';
import { combineQueries } from '../../database/combineQueries.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { buildAfterOperation } from './utils.js';

export type Arguments = {
  depth?: number
  collection: Collection
  where: Where
  req: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function deleteOperation<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments,
): Promise<{
  docs: GeneratedTypes['collections'][TSlug][],
  errors: {
    message: string
    id: GeneratedTypes['collections'][TSlug]['id']
  }[]
}> {
  let args = incomingArgs;

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
    await priorHook;

    args = (await hook({
      args,
      operation: 'delete',
      context: args.req.context,
    })) || args;
  }, Promise.resolve());

  const {
    depth,
    collection: {
      config: collectionConfig,
    },
    where,
    req,
    req: {
      t,
      payload,
      locale,
      payload: {
        config,
      },
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook: BeforeOperationHook | Promise<void>, hook: BeforeOperationHook) => {
      await priorHook;

      args = (await hook({
        args,
        operation: 'delete',
        context: req.context,
      })) || args;
    }, Promise.resolve());

    if (!where) {
      throw new APIError('Missing \'where\' query of documents to delete.', httpStatus.BAD_REQUEST);
    }

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult;

    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, collectionConfig.access.delete);
    }

    await validateQueryPaths({
      collectionConfig,
      where,
      req,
      overrideAccess,
    });

    const fullWhere = combineQueries(where, accessResult);

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const { docs } = await payload.db.find<GeneratedTypes['collections'][TSlug]>({
      locale,
      where: fullWhere,
      collection: collectionConfig.slug,
      req,
    });

    const errors = [];

    /* eslint-disable no-param-reassign */
    const promises = docs.map(async (doc) => {
      let result;

      const { id } = doc;

      try {
        // /////////////////////////////////////
        // beforeDelete - Collection
        // /////////////////////////////////////

        await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook) => {
          await priorHook;

          return hook({
            req,
            id,
            context: req.context,
          });
        }, Promise.resolve());

        await deleteAssociatedFiles({
          config,
          collectionConfig,
          doc,
          t,
          overrideDelete: true,
        });

        // /////////////////////////////////////
        // Delete document
        // /////////////////////////////////////

        await payload.db.deleteOne({
          collection: collectionConfig.slug,
          where: {
            id: {
              equals: id,
            },
          },
          req,
        });

        // /////////////////////////////////////
        // Delete versions
        // /////////////////////////////////////

        if (collectionConfig.versions) {
          deleteCollectionVersions({
            payload,
            id,
            slug: collectionConfig.slug,
            req,
          });
        }

        // /////////////////////////////////////
        // afterRead - Fields
        // /////////////////////////////////////

        result = await afterRead({
          depth,
          doc: result || doc,
          entityConfig: collectionConfig,
          overrideAccess,
          req,
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
            doc: result || doc,
            context: req.context,
          }) || result;
        }, Promise.resolve());

        // /////////////////////////////////////
        // afterDelete - Collection
        // /////////////////////////////////////

        await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
          await priorHook;

          result = await hook({
            req,
            id,
            doc: result,
            context: req.context,
          }) || result;
        }, Promise.resolve());

        // /////////////////////////////////////
        // 8. Return results
        // /////////////////////////////////////

        return result;
      } catch (error) {
        errors.push({
          message: error.message,
          id: doc.id,
        });
      }
      return null;
    });

    const awaitedDocs = await Promise.all(promises);

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    deleteUserPreferences({
      payload,
      collectionConfig,
      ids: docs.map(({ id }) => id),
      req,
    });

    let result = {
      docs: awaitedDocs.filter(Boolean),
      errors,
    };

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      operation: 'delete',
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

export default deleteOperation;
