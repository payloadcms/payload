/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../config/types';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { hasWhereAccessResult } from '../../auth/types';
import { afterChange } from '../../fields/hooks/afterChange';
import { afterRead } from '../../fields/hooks/afterRead';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion';
import { combineQueries } from '../../database/combineQueries';
import { FindOneArgs } from '../../database/types';

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
    locale,
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

  const findOneArgs: FindOneArgs = {
    collection: collectionConfig.slug,
    where: combineQueries({ id: { equals: parentDocID } }, accessResults),
    locale,
  };

  const doc = await req.payload.db.findOne(findOneArgs);


  if (!doc && !hasWherePolicy) throw new NotFound(t);
  if (!doc && hasWherePolicy) throw new Forbidden(t);

  // /////////////////////////////////////
  // fetch previousDoc
  // /////////////////////////////////////

  const prevDocWithLocales = await getLatestCollectionVersion({
    payload,
    id: parentDocID,
    query: findOneArgs,
    config: collectionConfig,
  });

  // /////////////////////////////////////
  // Update
  // /////////////////////////////////////

  let result = await req.payload.db.updateOne({
    collection: collectionConfig.slug,
    where: { id: { equals: parentDocID } },
    data: rawVersion.version,

  });

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
