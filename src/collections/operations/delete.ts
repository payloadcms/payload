import fs from 'fs';
import path from 'path';

import { PayloadRequest } from '../../express/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { NotFound, Forbidden, ErrorDeletingFile } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import fileExists from '../../uploads/fileExists';
import { BeforeOperationHook, Collection } from '../config/types';
import { Document, Where } from '../../types';
import { hasWhereAccessResult } from '../../auth/types';
import { FileData } from '../../uploads/types';

export type Arguments = {
  depth?: number
  collection: Collection
  id: string
  req: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function deleteQuery(incomingArgs: Arguments): Promise<Document> {
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
    id,
    req,
    req: {
      locale,
      fallbackLocale,
    },
    overrideAccess,
    showHiddenFields,
  } = args;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id }, collectionConfig.access.delete) : true;
  const hasWhereAccess = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // beforeDelete - Collection
  // /////////////////////////////////////

  collectionConfig.hooks.beforeDelete.forEach((hook) => hook({ req, id }));

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: {
    where: Where
  } = {
    where: {
      and: [
        {
          id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  const docToDelete = await Model.findOne(query);

  if (!docToDelete && !hasWhereAccess) throw new NotFound();
  if (!docToDelete && hasWhereAccess) throw new Forbidden();

  const resultToDelete = docToDelete.toJSON({ virtuals: true });

  // /////////////////////////////////////
  // Delete any associated files
  // /////////////////////////////////////

  if (collectionConfig.upload) {
    const { staticDir } = collectionConfig.upload;

    const staticPath = path.resolve(this.config.paths.configDir, staticDir);

    const fileToDelete = `${staticPath}/${resultToDelete.filename}`;
    if (await fileExists(fileToDelete)) {
      fs.unlink(fileToDelete, (err) => {
        if (err) {
          throw new ErrorDeletingFile();
        }
      });
    }

    if (resultToDelete.sizes) {
      Object.values(resultToDelete.sizes).forEach(async (size: FileData) => {
        if (await fileExists(`${staticPath}/${size.filename}`)) {
          fs.unlink(`${staticPath}/${size.filename}`, (err) => {
            if (err) {
              throw new ErrorDeletingFile();
            }
          });
        }
      });
    }
  }

  // /////////////////////////////////////
  // Delete document
  // /////////////////////////////////////

  const doc = await Model.findOneAndDelete({ _id: id });

  let result: Document = doc.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Delete Preferences
  // /////////////////////////////////////

  if (collectionConfig.auth) {
    await this.preferences.Model.deleteMany({ user: id, userCollection: collectionConfig.slug });
  }
  await this.preferences.Model.deleteMany({ key: `collection-${collectionConfig.slug}-${id}` });

  // /////////////////////////////////////
  // afterDelete - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({ req, id, doc: result }) || result;
  }, Promise.resolve());


  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'delete',
    overrideAccess,
    flattenLocales: true,
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
  // 8. Return results
  // /////////////////////////////////////

  return result;
}

export default deleteQuery;
