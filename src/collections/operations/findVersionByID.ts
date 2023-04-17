/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection, CollectionModel } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { Where } from '../../types';
import { hasWhereAccessResult } from '../../auth/types';
import { TypeWithVersion } from '../../versions/types';
import { afterRead } from '../../fields/hooks/afterRead';

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

async function findVersionByID<T extends TypeWithVersion<T> = any>(args: Arguments): Promise<T> {
  const {
    depth,
    collection: {
      config: collectionConfig,
    },
    id,
    req,
    req: {
      t,
      payload,
    },
    disableErrors,
    currentDepth,
    overrideAccess,
    showHiddenFields,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST);
  }

  const VersionsModel = (payload.versions[collectionConfig.slug]) as CollectionModel;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors, id }, collectionConfig.access.readVersions) : true;

  // If errors are disabled, and access returns false, return null
  if (accessResults === false) return null;

  const hasWhereAccess = typeof accessResults === 'object';

  const queryToBuild: Where = {
    and: [
      {
        _id: {
          equals: id,
        },
      },
    ],
  };

  if (hasWhereAccessResult(accessResults)) {
    queryToBuild.and.push(accessResults);
  }

  const query = await VersionsModel.buildQuery({
    where: queryToBuild,
    req,
    overrideAccess,
  });

  // /////////////////////////////////////
  // Find by ID
  // /////////////////////////////////////

  if (!query.$and[0]._id) throw new NotFound(t);

  let result = await VersionsModel.findOne(query, {}).lean();

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) throw new NotFound(t);
      if (hasWhereAccess) throw new Forbidden(t);
    }

    return null;
  }

  // Clone the result - it may have come back memoized
  result = JSON.parse(JSON.stringify(result));

  result = sanitizeInternalFields(result);

  // /////////////////////////////////////
  // beforeRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
    await priorHook;

    result.version = await hook({
      req,
      query,
      doc: result.version,
    }) || result.version;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result.version = await afterRead({
    currentDepth,
    depth,
    doc: result.version,
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

    result.version = await hook({
      req,
      query,
      doc: result.version,
    }) || result.version;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default findVersionByID;
