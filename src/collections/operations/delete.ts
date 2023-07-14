import { Config as GeneratedTypes } from 'payload/generated-types';
import httpStatus from 'http-status';
import { AccessResult } from '../../config/types';
import { PayloadRequest } from '../../express/types';
import { APIError } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { BeforeOperationHook, Collection } from '../config/types';
import { Where } from '../../types';
import { afterRead } from '../../fields/hooks/afterRead';
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences';
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths';
import { combineQueries } from '../../database/combineQueries';

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
      });

      // /////////////////////////////////////
      // afterRead - Collection
      // /////////////////////////////////////

      await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;

        result = await hook({
          req,
          doc: result || doc,
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

  return {
    docs: awaitedDocs.filter(Boolean),
    errors,
  };
}

export default deleteOperation;
