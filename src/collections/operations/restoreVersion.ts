/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../config/types';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { hasWhereAccessResult } from '../../auth/types';
import { Where } from '../../types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion';

export type Arguments = {
  collection: Collection
  id: string | number
  req: PayloadRequest
  disableErrors?: boolean
  currentDepth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  depth?: number
}

async function restoreVersion<T extends TypeWithID = any>(args: Arguments): Promise<T> {
  const {
    collection: {
      Model,
      config: collectionConfig,
    },
    id,
    overrideAccess = false,
    showHiddenFields,
    depth,
    req: {
      t,
      locale,
      payload,
    },
    req,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // Retrieve original raw version
  // /////////////////////////////////////

  const VersionModel = payload.versions[collectionConfig.slug];

  let rawVersion = await VersionModel.findOne({
    _id: id,
  });

  if (!rawVersion) {
    throw new NotFound(t);
  }

  rawVersion = rawVersion.toJSON({ virtuals: true });

  const parentDocID = rawVersion.parent;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id: parentDocID }, collectionConfig.access.update) : true;
  const hasWherePolicy = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const queryToBuild: Where = {
    and: [
      {
        id: {
          equals: parentDocID,
        },
      },
    ],
  };

  if (hasWhereAccessResult(accessResults)) {
    queryToBuild.and.push(accessResults);
  }

  const query = await Model.buildQuery({
    where: queryToBuild,
    req,
    overrideAccess,
  });

  const doc = await Model.findOne(query);

  if (!doc && !hasWherePolicy) throw new NotFound(t);
  if (!doc && hasWherePolicy) throw new Forbidden(t);

  // /////////////////////////////////////
  // fetch previousDoc
  // /////////////////////////////////////

  const prevDocWithLocales = await getLatestCollectionVersion({
    payload,
    id: parentDocID,
    query,
    Model,
    config: collectionConfig,
  });

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  let result = await Model.findByIdAndUpdate(
    { _id: parentDocID },
    rawVersion.version,
    { new: true },
  );

  result = result.toJSON({ virtuals: true });

  // custom id type reset
  result.id = result._id;
  result = JSON.parse(JSON.stringify(result));
  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // Save `previousDoc` as a version after restoring
  // /////////////////////////////////////

  const prevVersion = { ...prevDocWithLocales };

  delete prevVersion.id;

  await VersionModel.create({
    parent: parentDocID,
    version: rawVersion.version,
    autosave: false,
    createdAt: prevVersion.createdAt,
    updatedAt: new Date().toISOString(),
  });

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

  result = await afterChange({
    data: result,
    doc: result,
    previousDoc: prevDocWithLocales,
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
      req,
      previousDoc: prevDocWithLocales,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  return result;
}

export default restoreVersion;
