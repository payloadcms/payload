/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types.js';
import { Collection, TypeWithID } from '../config/types.js';
import { APIError, Forbidden, NotFound } from '../../errors/index.js';
import executeAccess from '../../auth/executeAccess.js';
import { hasWhereAccessResult } from '../../auth/types.js';
import { afterChange } from '../../fields/hooks/afterChange/index.js';
import { afterRead } from '../../fields/hooks/afterRead/index.js';
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js';
import { combineQueries } from '../../database/combineQueries.js';
import type { FindOneArgs } from '../../database/types.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';

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

  try {
    const shouldCommit = await initTransaction(req);

    if (!id) {
      throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST);
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const { docs: versionDocs } = await req.payload.db.findVersions({
      collection: collectionConfig.slug,
      where: { id: { equals: id } },
      locale,
      limit: 1,
      req,
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
      req,
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
      req,
    });

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    let result = await req.payload.db.updateOne({
      collection: collectionConfig.slug,
      id: parentDocID,
      data: rawVersion.version,
      req,
    });

    // /////////////////////////////////////
    // Save `previousDoc` as a version after restoring
    // /////////////////////////////////////

    const prevVersion = { ...prevDocWithLocales };

    delete prevVersion.id;

    await payload.db.createVersion({
      collectionSlug: collectionConfig.slug,
      parent: parentDocID,
      versionData: rawVersion.version,
      autosave: false,
      createdAt: prevVersion.createdAt,
      updatedAt: new Date().toISOString(),
      req,
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
      context: req.context,
    });

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        req,
        doc: result,
        context: req.context,
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
      context: req.context,
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
        context: req.context,
      }) || result;
    }, Promise.resolve());

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default restoreVersion;
