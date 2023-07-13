/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import { PayloadRequest } from '../../express/types';
import { Collection, TypeWithID } from '../config/types';
import { APIError, Forbidden, NotFound } from '../../errors';
import executeAccess from '../../auth/executeAccess';
import { TypeWithVersion } from '../../versions/types';
import { afterRead } from '../../fields/hooks/afterRead';
import { combineQueries } from '../../database/combineQueries';
import { initTransaction } from '../../utilities/initTransaction';
import { killTransaction } from '../../utilities/killTransaction';

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

async function findVersionByID<T extends TypeWithID = any>(args: Arguments): Promise<TypeWithVersion<T>> {
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
      locale,
    },
    disableErrors,
    currentDepth,
    overrideAccess,
    showHiddenFields,
  } = args;

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST);
  }

  try {
    const shouldCommit = await initTransaction(req);
    const { transactionID } = req;

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors, id }, collectionConfig.access.readVersions) : true;

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) return null;

    const hasWhereAccess = typeof accessResults === 'object';

    const fullWhere = combineQueries({ _id: { equals: id } }, accessResults);

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    const versionsQuery = await payload.db.findVersions<T>({
      locale,
      collection: collectionConfig.slug,
      limit: 1,
      pagination: false,
      where: fullWhere,
      transactionID,
    });

    const result = versionsQuery.docs[0];

    if (!result) {
      if (!disableErrors) {
        if (!hasWhereAccess) throw new NotFound(t);
        if (hasWhereAccess) throw new Forbidden(t);
      }

      return null;
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result.version = await hook({
        req,
        query: fullWhere,
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
        query: fullWhere,
        doc: result.version,
      }) || result.version;
    }, Promise.resolve());

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await payload.db.commitTransaction(req.transactionID);

    return result;
  } catch (error: unknown) {
    await killTransaction(req);
    throw error;
  }
}

export default findVersionByID;
