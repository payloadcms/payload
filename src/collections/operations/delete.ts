import fs from 'fs';
import path from 'path';

import httpStatus from 'http-status';
import { AccessResult } from '../../config/types';
import { PayloadRequest } from '../../express/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { ErrorDeletingFile, APIError } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { BeforeOperationHook, Collection } from '../config/types';
import { Document, Where } from '../../types';
import { hasWhereAccessResult } from '../../auth/types';
import { FileData } from '../../uploads/types';
import fileExists from '../../uploads/fileExists';
import { afterRead } from '../../fields/hooks/afterRead';

export type Arguments = {
  depth?: number
  collection: Collection
  where: Where
  req: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function deleteOperation(incomingArgs: Arguments): Promise<Document> {
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
      Model,
      config: collectionConfig,
    },
    where,
    req,
    req: {
      t,
      locale,
      payload: {
        config,
        preferences,
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

  const queryToBuild: { where?: Where } = {
    where: {
      and: [],
    },
  };

  if (where) {
    queryToBuild.where = {
      and: [],
      ...where,
    };

    if (Array.isArray(where.AND)) {
      queryToBuild.where.and = [
        ...queryToBuild.where.and,
        ...where.AND,
      ];
    }
  }

  let accessResult: AccessResult;

  if (!overrideAccess) {
    accessResult = await executeAccess({ req }, collectionConfig.access.delete);

    if (hasWhereAccessResult(accessResult)) {
      queryToBuild.where.and.push(accessResult);
    }
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // Retrieve documents
  // /////////////////////////////////////

  const docs = await Model.find(query, {}, { lean: true });

  /* eslint-disable no-param-reassign */
  const promises = docs.map(async (doc) => {
    let result;

    // custom id type reset
    doc.id = doc._id;
    doc = JSON.stringify(doc);
    doc = JSON.parse(doc);
    doc = sanitizeInternalFields(doc);

    const { id } = doc;

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


    // /////////////////////////////////////
    // Delete any associated files
    // /////////////////////////////////////

    if (collectionConfig.upload) {
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
        Object.values(doc.sizes)
          .forEach(async (size: FileData) => {
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
    // Delete document
    // /////////////////////////////////////

    await Model.deleteOne({ _id: id }, { lean: true });

    // /////////////////////////////////////
    // afterDelete - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        req,
        id,
        doc,
      }) || doc;
    }, Promise.resolve());


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
    // 8. Return results
    // /////////////////////////////////////

    return result;
  });

  await Promise.all(promises);

  // /////////////////////////////////////
  // Delete Preferences
  // /////////////////////////////////////

  if (collectionConfig.auth) {
    preferences.Model.deleteMany({
      user: { in: docs.map(({ id }) => id) },
      userCollection: collectionConfig.slug,
    });
  }
  preferences.Model.deleteMany({ key: { in: docs.map(({ id }) => `collection-${collectionConfig.slug}-${id}`) } });

  return Promise.all(promises);
}

export default deleteOperation;
