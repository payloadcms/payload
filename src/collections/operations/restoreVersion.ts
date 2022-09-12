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
    throw new NotFound();
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

  const queryToBuild: { where: Where } = {
    where: {
      and: [
        {
          id: {
            equals: parentDocID,
          },
        },
      ],
    },
  };

  if (hasWhereAccessResult(accessResults)) {
    (queryToBuild.where.and as Where[]).push(accessResults);
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  const doc = await Model.findOne(query);

  if (!doc && !hasWherePolicy) throw new NotFound();
  if (!doc && hasWherePolicy) throw new Forbidden();

  // /////////////////////////////////////
  // fetch previousDoc
  // /////////////////////////////////////

  const previousDoc = await payload.findByID({
    collection: collectionConfig.slug,
    id: parentDocID,
    depth,
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
  result = JSON.stringify(result);
  result = JSON.parse(result);
  result = sanitizeInternalFields(result);

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
    previousDoc,
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
      previousDoc,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  return result;
}

export default restoreVersion;
