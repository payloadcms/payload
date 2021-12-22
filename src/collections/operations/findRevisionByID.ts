/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { Payload } from '../../index';
import { PayloadRequest } from '../../express/types';
import { Collection, CollectionModel } from '../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { Where } from '../../types';
import { hasWhereAccessResult } from '../../auth/types';
import { TypeWithRevision } from '../../revisions/types';

export type Arguments = {
  collection: Collection
  id: string
  req: PayloadRequest
  disableErrors?: boolean
  currentDepth?: number
  overrideAccess?: boolean
  showHiddenFields?: boolean
  depth?: number
}

async function findRevisionByID<T extends TypeWithRevision<T> = any>(this: Payload, args: Arguments): Promise<T> {
  const {
    depth,
    collection: {
      config: collectionConfig,
    },
    id,
    req,
    req: {
      locale,
    },
    disableErrors,
    currentDepth,
    overrideAccess,
    showHiddenFields,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of revision.', httpStatus.BAD_REQUEST);
  }

  const RevisionsModel = (this.revisions[collectionConfig.slug]) as CollectionModel;

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors, id }, collectionConfig.access.readRevisions) : true;

  // If errors are disabled, and access returns false, return null
  if (accessResults === false) return null;

  const hasWhereAccess = typeof accessResults === 'object';

  const queryToBuild: { where: Where } = {
    where: {
      and: [
        {
          _id: {
            equals: id,
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await RevisionsModel.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // Find by ID
  // /////////////////////////////////////

  if (!query.$and[0]._id) throw new NotFound();

  let result = await RevisionsModel.findOne(query, {}).lean();

  if (!result) {
    if (!disableErrors) {
      if (!hasWhereAccess) throw new NotFound();
      if (hasWhereAccess) throw new Forbidden();
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

    result.revision = await hook({
      req,
      query,
      doc: result.revision,
    }) || result.revision;
  }, Promise.resolve());

  // /////////////////////////////////////
  // afterRead - Fields
  // /////////////////////////////////////

  result.revision = await this.performFieldOperations(collectionConfig, {
    depth,
    req,
    id,
    data: result.revision,
    hook: 'afterRead',
    operation: 'read',
    currentDepth,
    overrideAccess,
    flattenLocales: true,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterRead - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    result.revision = await hook({
      req,
      query,
      doc: result.revision,
    }) || result.revision;
  }, Promise.resolve());

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result;
}

export default findRevisionByID;
