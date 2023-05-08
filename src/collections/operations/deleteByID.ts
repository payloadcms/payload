import { Config as GeneratedTypes } from 'payload/generated-types';
import { PayloadRequest } from '../../express/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { NotFound, Forbidden } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { BeforeOperationHook, Collection } from '../config/types';
import { Document, Where } from '../../types';
import { hasWhereAccessResult } from '../../auth/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions';
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles';

export type Arguments = {
  depth?: number
  collection: Collection
  id: string | number
  req: PayloadRequest
  overrideAccess?: boolean
  showHiddenFields?: boolean
}

async function deleteByID<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments): Promise<Document> {
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
      t,
      payload,
      payload: {
        config,
        preferences,
      },
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

  await collectionConfig.hooks.beforeDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    return hook({
      req,
      id,
    });
  }, Promise.resolve());

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const query = await Model.buildQuery({
    req,
    where: {
      id: {
        equals: id,
      },
    },
    access: accessResults,
    overrideAccess,
  });

  const docToDelete = await Model.findOne(query);

  if (!docToDelete && !hasWhereAccess) throw new NotFound(t);
  if (!docToDelete && hasWhereAccess) throw new Forbidden(t);

  const resultToDelete = docToDelete.toJSON({ virtuals: true });

  await deleteAssociatedFiles({ config, collectionConfig, doc: resultToDelete, t, overrideDelete: true });

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
    await preferences.Model.deleteMany({ user: id, userCollection: collectionConfig.slug });
  }
  await preferences.Model.deleteMany({ key: `collection-${collectionConfig.slug}-${id}` });

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
      req,
      doc: result,
    }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterDelete - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterDelete.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({ req, id, doc: result }) || result;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 8. Return results
  // /////////////////////////////////////

  return result;
}

export default deleteByID;
