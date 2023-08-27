/* eslint-disable no-underscore-dangle */
import { PayloadRequest } from '../../express/types.js';
import { Forbidden, NotFound } from '../../errors.js';
import executeAccess from '../../auth/executeAccess.js';
import { TypeWithVersion } from '../../versions/types.js';
import { SanitizedGlobalConfig } from '../config/types.js';
import { afterRead } from '../../fields/hooks/afterRead.js';
import { combineQueries } from '../../database/combineQueries.js';
import { FindGlobalVersionsArgs } from '../../database/types.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { initTransaction } from '../../utilities/initTransaction.js';

export type Arguments = {
  globalConfig: SanitizedGlobalConfig
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
    globalConfig,
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

  try {
    const shouldCommit = await initTransaction(req);

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess ? await executeAccess({ req, disableErrors, id }, globalConfig.access.readVersions) : true;

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) return null;

    const hasWhereAccess = typeof accessResults === 'object';

    const findGlobalVersionsArgs: FindGlobalVersionsArgs = {
      global: globalConfig.slug,
      where: combineQueries({ id: { equals: id } }, accessResults),
      locale,
      limit: 1,
      req,
    };

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    if (!findGlobalVersionsArgs.where.and[0].id) throw new NotFound(t);


    const { docs: results } = await payload.db.findGlobalVersions(findGlobalVersionsArgs);
    if (!results || results?.length === 0) {
      if (!disableErrors) {
        if (!hasWhereAccess) throw new NotFound(t);
        if (hasWhereAccess) throw new Forbidden(t);
      }

      return null;
    }


    // Clone the result - it may have come back memoized
    let result = JSON.parse(JSON.stringify(results[0]));

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result = await hook({
        req,
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
      entityConfig: globalConfig,
      req,
      overrideAccess,
      showHiddenFields,
      context: req.context,
    });

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook;

      result.version = await hook({
        req,
        query: findGlobalVersionsArgs.where,
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
