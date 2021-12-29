/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection } from '../config/types';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { Payload } from '../../index';
import { hasWhereAccessResult } from '../../auth/types';
import { Where } from '../../types';
import { TypeWithID } from '../../globals/config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';

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

async function restoreVersion<T extends TypeWithID = any>(this: Payload, args: Arguments): Promise<T> {
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
    },
    req,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // Retrieve original raw version to get parent ID
  // /////////////////////////////////////

  const VersionModel = this.versions[collectionConfig.slug];

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

  result = await this.performFieldOperations(collectionConfig, {
    id: parentDocID,
    depth,
    req,
    data: result,
    hook: 'afterRead',
    operation: 'update',
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
  // afterChange - Fields
  // /////////////////////////////////////

  result = await this.performFieldOperations(collectionConfig, {
    data: result,
    hook: 'afterChange',
    operation: 'update',
    req,
    id: parentDocID,
    depth,
    overrideAccess,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // afterChange - Collection
  // /////////////////////////////////////

  await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
    await priorHook;

    result = await hook({
      doc: result,
      req,
      operation: 'update',
    }) || result;
  }, Promise.resolve());

  return result;
}

export default restoreVersion;
