/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../config/types';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { hasWhereAccessResult } from '../../auth/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion';
import { combineQueries } from '../../database/combineQueries';
import { FindArgs } from '../../database/types';

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
      payload,
      locale,
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


  const { docs: versionDocs } = await req.payload.db.findVersions({
    collection: collectionConfig.slug,
    where: { id: { equals: id } },
    locale: req.locale,
    limit: 1,
  });

  const [rawVersion] = versionDocs;

  if (!rawVersion) {
    throw new NotFound(t);
  }

  const parentDocID = rawVersion.parent;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, id: parentDocID }, collectionConfig.access.update) : true;
  const hasWherePolicy = hasWhereAccessResult(accessResults);

  // /////////////////////////////////////
  // Retrieve document
  // /////////////////////////////////////

  const findArgs: FindArgs = {
    collection: collectionConfig.slug,
    where: combineQueries({ id: { equals: parentDocID } }, accessResults),
    locale: req.locale,
    limit: 1,
  };

  const { docs } = await req.payload.db.find(findArgs);

  const [doc] = docs;

  if (!doc && !hasWherePolicy) throw new NotFound(t);
  if (!doc && hasWherePolicy) throw new Forbidden(t);

  // /////////////////////////////////////
  // fetch previousDoc
  // /////////////////////////////////////

  const prevDocWithLocales = await getLatestCollectionVersion({
    payload,
    id: parentDocID,
    query: findArgs,
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
